import type { AppData, Capture, Word } from "@/services/data"

export type UploadTrigger =
  "cold_start" | "foreground" | "network" | "consent" | "session_end" | "accumulation"

export type UploadResponse = { status: number; body: unknown }

export type CaptureOutcome = { capture: Capture; status: "success" | "rejected" }

export function captureOutcomes(sent: Capture[], response: UploadResponse): CaptureOutcome[] {
  if (
    response.status < 200 ||
    response.status >= 300 ||
    !response.body ||
    typeof response.body !== "object"
  ) {
    return []
  }

  const data = (response.body as { data?: unknown }).data

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return []
  }

  return sent.flatMap((capture) => {
    const entry = (data as Record<string, unknown>)[capture.id]
    const status =
      entry && typeof entry === "object" ? (entry as { status?: unknown }).status : null

    return status === "success" || status === "rejected" ? [{ capture, status }] : []
  })
}

export type UploadDependencies = {
  read: () => AppData
  update: (change: (data: AppData) => void) => AppData
  identity: () => string | null
  configured: () => boolean
  inspect: (uri: string) => Promise<{ exists: boolean; size: number }>
  sendWord: (word: Word, uid: string, signal?: AbortSignal) => Promise<UploadResponse>
  sendCaptures: (captures: Capture[], uid: string, signal?: AbortSignal) => Promise<UploadResponse>
  cleanup: () => Promise<void>
  resolved: (
    outcome: CaptureOutcome,
    batchSize: number,
    retrySingle: boolean,
    httpStatus?: number,
  ) => void
  aborted: (
    reason: "server_error" | "network_error" | "unreadable_response" | "exception",
    successfulCaptureCount: number,
    status?: number,
  ) => void
  rejectedWord: (word: Word, response: UploadResponse) => void
  error: (error: unknown) => void
}

/** Persistence and transport are separate so a failed commit cannot authorize file deletion. */
export function createUploadWorker(dependencies: UploadDependencies) {
  let captureUploadTask: Promise<void> | null = null
  let wordUploadTask: Promise<void> | null = null
  let captureTriggerCount = 0
  let wordTriggerCount = 0
  let automaticCaptureRetryBlocked = false
  const canUpload = (signal?: AbortSignal) =>
    !signal?.aborted &&
    dependencies.configured() &&
    dependencies.read().settings.uploadConsent.status === "granted" &&
    !!dependencies.identity()

  function saveCaptureOutcomes(
    outcomes: CaptureOutcome[],
    batchSize: number,
    retrySingle: boolean,
    httpStatus?: number,
  ) {
    dependencies.update((data) => {
      for (const { capture } of outcomes) {
        if (!data.captures[capture.id]) {
          continue
        }

        delete data.captures[capture.id]

        if (!data.pendingFileDeletes.includes(capture.uri)) {
          data.pendingFileDeletes.push(capture.uri)
        }
      }
    })

    for (const outcome of outcomes) {
      dependencies.resolved(outcome, batchSize, retrySingle, httpStatus)
    }
  }

  async function uploadPendingCaptures(signal?: AbortSignal) {
    let successfulCaptureCount = 0
    const abortCaptureUpload = (
      reason: Parameters<UploadDependencies["aborted"]>[0],
      status?: number,
    ) => {
      dependencies.aborted(reason, successfulCaptureCount, status)

      return false
    }

    async function uploadCaptureBatch(batch: Capture[], retrySingle = false): Promise<boolean> {
      if (!canUpload(signal)) {
        return false
      }

      let response: UploadResponse

      try {
        response = await dependencies.sendCaptures(batch, dependencies.identity()!, signal)
      } catch (error) {
        dependencies.error(error)

        if (signal?.aborted) {
          return false
        }

        return abortCaptureUpload(
          error instanceof TypeError ||
            (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))
            ? "network_error"
            : "exception",
        )
      }

      const { status } = response

      if (status >= 400 && status < 500) {
        if (batch.length > 1) {
          for (const item of batch) {
            if (!(await uploadCaptureBatch([item], true))) {
              return false
            }
          }

          return true
        }

        saveCaptureOutcomes([{ capture: batch[0], status: "rejected" }], 1, retrySingle, status)
        await dependencies.cleanup()

        return true
      }

      if (status < 200 || status >= 300) {
        return abortCaptureUpload("server_error", status)
      }

      const outcomes = captureOutcomes(batch, response)

      if (!outcomes.length) {
        return abortCaptureUpload("unreadable_response", status)
      }

      saveCaptureOutcomes(outcomes, batch.length, retrySingle)
      successfulCaptureCount += outcomes.filter((item) => item.status === "success").length
      await dependencies.cleanup()

      return true
    }

    try {
      await dependencies.cleanup()

      while (canUpload(signal)) {
        const orderedCaptures = Object.values(dependencies.read().captures).sort(
          (a, b) => (Date.parse(a.capturedAt) || 0) - (Date.parse(b.capturedAt) || 0),
        )
        const captureBatch: Capture[] = []
        let batchBytes = 0

        for (const capture of orderedCaptures) {
          const fileInfo = await dependencies.inspect(capture.uri)

          if (!fileInfo.exists) {
            dependencies.update((data) => {
              delete data.captures[capture.id]
            })
            continue
          }

          if (captureBatch.length > 0 && batchBytes + fileInfo.size > 9 * 1024 * 1024) {
            break
          }

          captureBatch.push(capture)
          batchBytes += fileInfo.size

          if (captureBatch.length === 10) {
            break
          }
        }

        if (!captureBatch.length) {
          return true
        }

        if (!(await uploadCaptureBatch(captureBatch))) {
          return false
        }
      }

      return true
    } catch (error) {
      dependencies.error(error)

      return abortCaptureUpload("exception")
    }
  }

  function triggerCaptures(reason: UploadTrigger, signal?: AbortSignal) {
    if (reason !== "accumulation") {
      captureTriggerCount++
      automaticCaptureRetryBlocked = false
    }

    if (captureUploadTask) {
      return captureUploadTask
    }

    if (
      reason === "accumulation" &&
      (automaticCaptureRetryBlocked || Object.keys(dependencies.read().captures).length < 10)
    ) {
      return Promise.resolve()
    }

    captureUploadTask = (async () => {
      do {
        const observedTriggerCount = captureTriggerCount

        automaticCaptureRetryBlocked = !(await uploadPendingCaptures(signal))

        if (captureTriggerCount === observedTriggerCount || signal?.aborted) {
          break
        }

        automaticCaptureRetryBlocked = false
      } while (true)
    })().finally(() => {
      captureUploadTask = null
    })

    return captureUploadTask
  }

  function triggerWords(all = false, wordId?: string, signal?: AbortSignal) {
    dependencies.update((data) => {
      let wordIdsToQueue: string[] = []

      if (all) {
        wordIdsToQueue = Object.values(data.words)
          .filter((word) => word.sourceType === "recording" && !word.archived)
          .map((word) => word.id)
      } else if (wordId) {
        wordIdsToQueue = [wordId]
      }

      data.pendingWords = [...new Set([...data.pendingWords, ...wordIdsToQueue])]
    })
    wordTriggerCount++

    if (wordUploadTask) {
      return wordUploadTask
    }

    wordUploadTask = (async () => {
      do {
        const observedTriggerCount = wordTriggerCount

        try {
          const data = dependencies.read()
          const pendingWordIds = [...data.pendingWords].sort((a, b) =>
            (data.words[a]?.createdAt ?? "").localeCompare(data.words[b]?.createdAt ?? ""),
          )

          for (const id of pendingWordIds) {
            if (!canUpload(signal)) {
              break
            }

            const word = dependencies.read().words[id]

            if (word?.sourceType === "recording" && !word.archived) {
              let fileInfo: { exists: boolean; size: number }

              try {
                fileInfo = await dependencies.inspect(word.audioUri)
              } catch (error) {
                dependencies.error(error)
                continue
              }

              if (!fileInfo.exists) {
                continue
              }

              const response = await dependencies.sendWord(word, dependencies.identity()!, signal)

              if (response.status >= 400 && response.status < 500) {
                dependencies.rejectedWord(word, response)
              } else if (response.status < 200 || response.status >= 300) {
                return
              }
            }

            dependencies.update((next) => {
              const current = next.words[id]

              if (current?.updatedAt === word?.updatedAt && current?.audioUri === word?.audioUri) {
                next.pendingWords = next.pendingWords.filter((value) => value !== id)
              }
            })
          }
        } catch (error) {
          dependencies.error(error)

          return
        }

        if (wordTriggerCount === observedTriggerCount || signal?.aborted) {
          break
        }
      } while (true)
    })().finally(() => {
      wordUploadTask = null
    })

    return wordUploadTask
  }

  return {
    triggerCaptures,
    triggerWords,
    isUploading: () => captureUploadTask !== null || wordUploadTask !== null,
  }
}
