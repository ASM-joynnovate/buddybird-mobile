import type {
  CapturedSegment,
  PendingRecovery,
  SessionAudioEngineModule,
} from "@modules/session-audio-engine"
import type { AppData, Capture, SessionDraft } from "@/services/data"
import { creditRecovery, recoveryDraft } from "@/services/sessionHistory"

type TransferStore = {
  read(): AppData
  update(change: (data: AppData) => void): AppData
  fileSize(uri: string): number
  captureSaved?(capture: Capture, pendingCount: number): void
  finalized?(recovery: PendingRecovery, draft: SessionDraft): void
}
type NativeTransfer = Pick<
  SessionAudioEngineModule,
  | "getSnapshot"
  | "getPendingRecovery"
  | "getUnstoredSegments"
  | "markSegmentsStored"
  | "clearPendingRecovery"
>

/** A narrow I/O boundary lets fault tests exercise the actual save/ACK/clear ordering. */
export async function transferNativeState(native: NativeTransfer, store: TransferStore) {
  async function persistAndAcknowledgeCaptures(
    segments: CapturedSegment[],
    recovery: PendingRecovery | null,
  ) {
    const acknowledgedCaptureIds: string[] = []

    for (const segment of segments) {
      const data = store.read()

      if (
        data.nativeCaptureReceipts.includes(segment.segmentId) ||
        data.captures[segment.segmentId]
      ) {
        if (!data.nativeCaptureReceipts.includes(segment.segmentId)) {
          store.update((next) => {
            next.nativeCaptureReceipts.push(segment.segmentId)
          })
        }

        acknowledgedCaptureIds.push(segment.segmentId)
        continue
      }

      let draft = data.sessionDrafts[segment.sessionId]

      if (!draft && recovery?.sessionId === segment.sessionId) {
        draft = recoveryDraft(data, recovery)
      }

      const history = data.history[segment.sessionId]

      if (!draft && history) {
        draft = {
          id: history.id,
          settings: history,
          word: history.word,
          startedAt: history.startedAt,
          clientWordId: history.word.presetKey
            ? `preset-${history.word.presetKey}`
            : (history.libraryEntryId ?? history.wordId),
          parrotSpecies: data.profile?.species ?? null,
          parrotBirthdate: data.profile?.birthDate ?? null,
        }
      }

      if (!draft) {
        throw new Error(`Capture context unavailable: ${segment.sessionId}`)
      }

      const sizeBytes = store.fileSize(segment.uri)

      if (!Number.isFinite(sizeBytes) || sizeBytes < 44) {
        throw new Error("Pending native recording unavailable")
      }

      const capture: Capture = {
        id: segment.segmentId,
        sessionId: segment.sessionId,
        wordId: draft.settings.wordId,
        clientWordId: draft.clientWordId,
        parrotSpecies: draft.parrotSpecies,
        parrotBirthdate: draft.parrotBirthdate,
        cycle: segment.cycle,
        phase: segment.phase,
        capturedAt: segment.capturedAt,
        uri: `recording://session-captures/${segment.fileName}`,
        fileName: segment.fileName,
        segments: [
          {
            startMs: Math.min(segment.durationMs, Math.max(0, segment.speechStartMs)),
            endMs: Math.min(
              segment.durationMs,
              Math.max(segment.speechStartMs, segment.speechEndMs),
            ),
          },
        ],
        sizeBytes,
      }
      const saved = store.update((next) => {
        next.captures[capture.id] = capture
        next.nativeCaptureReceipts.push(capture.id)
        next.sessionDrafts[draft.id] = {
          ...draft,
          captureCount: (draft.captureCount ?? 0) + 1,
          captureDurationMs: (draft.captureDurationMs ?? 0) + segment.durationMs,
        }
      })

      store.captureSaved?.(capture, Object.keys(saved.captures).length)
      acknowledgedCaptureIds.push(segment.segmentId)
    }

    if (acknowledgedCaptureIds.length) {
      await native.markSegmentsStored(acknowledgedCaptureIds)
    }

    const unacknowledgedCaptureIds = new Set(
      segments
        .map((segment) => segment.segmentId)
        .filter((id) => !acknowledgedCaptureIds.includes(id)),
    )

    if (store.read().nativeCaptureReceipts.some((id) => !unacknowledgedCaptureIds.has(id))) {
      store.update((data) => {
        data.nativeCaptureReceipts = data.nativeCaptureReceipts.filter((id) =>
          unacknowledgedCaptureIds.has(id),
        )
      })
    }
  }

  await persistAndAcknowledgeCaptures(
    await native.getUnstoredSegments(),
    await native.getPendingRecovery(),
  )
  const snapshot = await native.getSnapshot()

  if (["starting", "running", "paused", "interrupted", "stopping"].includes(snapshot.state)) {
    return
  }

  // A phase/completion flush can happen while the first ACK crosses the native bridge.
  const finalRecovery = await native.getPendingRecovery()

  if (!finalRecovery) {
    return
  }

  await persistAndAcknowledgeCaptures(await native.getUnstoredSegments(), finalRecovery)
  const draft = recoveryDraft(store.read(), finalRecovery)

  store.update((data) => {
    creditRecovery(data, finalRecovery)
  })
  await native.clearPendingRecovery(finalRecovery.sessionId)
  store.finalized?.(finalRecovery, draft)
  store.update((data) => {
    delete data.sessionDrafts[finalRecovery.sessionId]
  })
}
