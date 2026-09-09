import NetInfo from "@react-native-community/netinfo"
import * as Device from "expo-device"
import { Directory, File, Paths } from "expo-file-system"
import { AppState, Platform } from "react-native"

import { config } from "@/config"
import {
  currentIdentity,
  ensureAnonymousIdentity,
  installedVersion,
  subscribeIdentity,
} from "@/services/api/firebase"
import { HttpError, requestJSON } from "@/services/api/http"
import { isMediaReferenced } from "@/services/api/filePolicy"
import { audioFile, captureMetadata, codePoints } from "@/services/api/multipart"
import {
  createUploadWorker,
  type UploadResponse,
  type UploadTrigger,
} from "@/services/api/uploadWorker"
import { writeCaptureZip } from "@/services/api/zip"
import type { Capture, Word } from "@/services/data"
import { resolveRecordingUri } from "@/services/media"
import { readData, updateData } from "@/services/storage"
import { reportError, setTelemetryIdentity, track } from "@/services/telemetry"

function uploadOrigin() {
  const origin = config.apiBaseUrl.trim().replace(/\/+$/, "")

  if (!origin) {
    return ""
  }

  const parsed = new URL(origin)

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Invalid collection origin")
  }

  return origin
}

function permitted(signal?: AbortSignal) {
  if (
    signal?.aborted ||
    readData().settings.uploadConsent.status !== "granted" ||
    !currentIdentity()
  ) {
    throw new Error("Upload not permitted")
  }
}

function deviceForm(uid: string) {
  const form = new FormData()

  form.append("firebase_anon_uid", uid)
  form.append("device_platform", Platform.OS === "ios" ? "iOS" : "Android")
  form.append("device_os_version", codePoints(Device.osVersion ?? "", 20))
  form.append("device_model", codePoints(Device.modelName ?? "", 30))

  return form
}

async function post(
  path: string,
  form: FormData,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<UploadResponse> {
  const origin = uploadOrigin()

  if (!origin) {
    throw new Error("Collection origin is not configured")
  }

  permitted(signal)

  try {
    return {
      status: 200,
      body: await requestJSON(`${origin}${path}`, {
        method: "POST",
        body: form,
        timeoutMs,
        signal,
        optionalJSON: true,
      }),
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: error.body }
    }

    throw error
  }
}

export async function sendWordReference(word: Word, uid: string, signal?: AbortSignal) {
  const uri = resolveRecordingUri(word.audioUri)
  const form = deviceForm(uid)

  form.append("client_word_id", word.id)
  form.append("label", codePoints(word.label, 50))
  form.append("audio_file", { uri, ...audioFile(uri) } as unknown as Blob)

  return post("/api/v1/words", form, 30_000, signal)
}

async function inspect(uri: string) {
  const file = new File(resolveRecordingUri(uri))

  if (!file.exists) {
    // exists=false also means inaccessible on some platforms; a successful parent
    // listing that omits the entry is required before treating it as absent.
    if (file.parentDirectory.list().some((entry) => entry.name === file.name)) {
      throw new Error("File is inaccessible")
    }

    return { exists: false, size: 0 }
  }

  const handle = file.open()

  try {
    handle.readBytes(1)

    return { exists: true, size: handle.size ?? file.size }
  } finally {
    handle.close()
  }
}

async function* chunks(uri: string, signal?: AbortSignal) {
  const handle = new File(resolveRecordingUri(uri)).open()

  try {
    while (true) {
      permitted(signal)
      const chunk = handle.readBytes(64 * 1024)

      if (!chunk.length) {
        break
      }

      yield chunk
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  } finally {
    handle.close()
  }
}

export async function sendCaptureBatch(captures: Capture[], uid: string, signal?: AbortSignal) {
  const directory = new Directory(Paths.cache, "capture-upload")

  directory.create({ intermediates: true, idempotent: true })

  // A single capture worker owns this temporary directory, including after restart.
  for (const leftover of directory.list()) {
    leftover.delete()
  }

  const archive = new File(directory, "captures.zip")

  archive.create()
  const handle = archive.open()

  try {
    await writeCaptureZip(
      captures.map((capture) => ({ name: capture.fileName, chunks: chunks(capture.uri, signal) })),
      (chunk) => handle.writeBytes(chunk),
      signal,
    )
  } catch (error) {
    handle.close()

    try {
      archive.delete()
    } catch {
      /* Temporary ZIP cleanup can retry on the next batch. */
    }

    throw error
  }

  handle.close()

  try {
    const form = deviceForm(uid)

    form.append(
      "metadata",
      JSON.stringify(captures.map((capture) => captureMetadata(capture, installedVersion))),
    )
    form.append("file", {
      uri: archive.uri,
      name: "captures.zip",
      type: "application/zip",
    } as unknown as Blob)

    return await post("/api/v1/captures", form, 60_000, signal)
  } finally {
    try {
      archive.delete()
    } catch {
      /* Temporary ZIP cleanup can retry on the next batch. */
    }
  }
}

export async function drainFileDeletes() {
  for (const uri of readData().pendingFileDeletes) {
    const resolved = resolveRecordingUri(uri)

    if (isMediaReferenced(readData(), uri, resolveRecordingUri)) {
      continue
    }

    try {
      const info = await inspect(uri)

      if (isMediaReferenced(readData(), uri, resolveRecordingUri)) {
        continue
      }

      if (info.exists) {
        new File(resolved).delete()
      }

      updateData((next) => {
        next.pendingFileDeletes = next.pendingFileDeletes.filter((value) => value !== uri)
      })
    } catch (error) {
      reportError(error, "file_cleanup")
    }
  }
}

const age = (capture: Capture) => {
  const at = Date.parse(capture.capturedAt)

  return Number.isFinite(at) ? Math.max(0, Date.now() - at) : undefined
}

const worker = createUploadWorker({
  read: readData,
  update: updateData,
  identity: currentIdentity,
  configured: () => !!uploadOrigin(),
  inspect,
  sendWord: sendWordReference,
  sendCaptures: sendCaptureBatch,
  cleanup: drainFileDeletes,
  resolved: ({ capture, status }, batchSize, retrySingle, httpStatus) => {
    if (status === "success") {
      track("capture_upload_succeeded", {
        client_capture_id: capture.id,
        latency_ms: age(capture),
        batch_size: batchSize,
        is_retry_single: retrySingle,
      })
    } else {
      track("capture_upload_failed", {
        client_capture_id: capture.id,
        reason: "server_reject",
        age_ms: age(capture),
        http_status: httpStatus,
      })
    }
  },
  aborted: (reason, succeeded, status) => {
    let pending: number | undefined

    try {
      pending = Object.keys(readData().captures).length
    } catch {
      /* Storage may be the failure. */
    }

    track("capture_flush_aborted", {
      reason,
      succeeded_before_abort: succeeded,
      pending_count: pending,
      http_status: status,
    })
  },
  rejectedWord: (_word, response) => {
    const code =
      response.body && typeof response.body === "object" && "error_code" in response.body
        ? response.body.error_code
        : null

    reportError(
      new Error(
        `Reference rejected: HTTP ${response.status}${typeof code === "string" ? ` (${code})` : ""}`,
      ),
      "reference_upload",
    )
  },
  error: (error) => reportError(error, "upload"),
})

export const isUploading = worker.isUploading

export const queueWordUpload = (id: string) => worker.triggerWords(false, id)

export function triggerUploads(reason: UploadTrigger, signal?: AbortSignal) {
  const captures = worker.triggerCaptures(reason, signal)
  const words =
    reason === "cold_start" || reason === "consent"
      ? worker.triggerWords(true, undefined, signal)
      : Promise.resolve()

  return Promise.all([captures, words]).then(() => {})
}

export async function setUploadConsent(status: "granted" | "denied") {
  updateData((data) => {
    data.settings.uploadConsent = { status, decidedAt: new Date().toISOString(), noticeVersion: 1 }
  })

  if (status === "granted") {
    void triggerUploads("consent").catch((error) => reportError(error, "consent_upload"))
  }
}

export function startUploads() {
  readData()
  const controller = new AbortController()
  let previousState = AppState.currentState
  let connected: boolean | null = null
  let firstIdentity = true
  const run = (reason: UploadTrigger) => {
    void triggerUploads(reason, controller.signal).catch((error) =>
      reportError(error, "upload_trigger"),
    )
  }

  const auth = subscribeIdentity((uid) => {
    if (uid) {
      setTelemetryIdentity(uid)

      if (firstIdentity) {
        firstIdentity = false
        run("cold_start")
      }
    }
  })

  void ensureAnonymousIdentity().catch((error) => reportError(error, "anonymous_auth"))
  const app = AppState.addEventListener("change", (state) => {
    if (state === "active" && previousState !== "active") {
      if (!currentIdentity()) {
        void ensureAnonymousIdentity().catch((error) => reportError(error, "anonymous_auth"))
      }

      run("foreground")
    }

    previousState = state
  })
  const network = NetInfo.addEventListener((state) => {
    const online = state.isConnected === true && state.isInternetReachable !== false

    if (connected === false && online) {
      run("network")
    }

    connected = online
  })

  return () => {
    controller.abort()
    auth()
    app.remove()
    network()
  }
}
