import { randomUUID } from "expo-crypto"
import { AudioModule } from "expo-audio"
import { File } from "expo-file-system"

import engine, { defaultVAD, SessionInput, SessionSnapshot } from "@modules/session-audio-engine"
import { currentWord, SessionDraft, SessionSettings } from "@/services/data"
import {
  captureDirectory,
  resolveAudio,
  resolveRecordingUri,
  stressCareAudio,
} from "@/services/media"
import { learningSeconds } from "@/services/sessionHistory"
import { transferNativeState } from "@/services/sessionTransfer"
import { track } from "@/services/telemetry"
import { readData, updateData } from "@/services/storage"

let reconciliation: Promise<void> | undefined
let reconcileAgain = false

/** Native checkpoints and manifests are retained on any failed save/ACK/clear. */
export function recoverNativeData(): Promise<void> {
  if (reconciliation) {
    reconcileAgain = true

    return reconciliation
  }

  reconciliation = (async () => {
    do {
      reconcileAgain = false
      await transferNativeState(engine, {
        read: readData,
        update: updateData,
        fileSize: (uri) => {
          const file = new File(resolveRecordingUri(uri))

          if (!file.exists) {
            throw new Error("Pending native recording unavailable")
          }

          return file.size
        },
        captureSaved: (capture, pendingCount) => {
          track("follow_along_capture_created", {
            client_capture_id: capture.id,
            session_id: capture.sessionId,
            client_word_id: capture.clientWordId,
            cycle: capture.cycle,
            phase: capture.phase,
            audio_size_bytes: capture.sizeBytes,
            pending_count: pendingCount,
          })
        },
        finalized: (recovery, draft) => {
          const count = draft.captureCount ?? 0

          track("word_practice_completed", {
            session_id: recovery.sessionId,
            word_id: draft.settings.wordId,
            word_name: draft.word.label,
            practice_duration_ms:
              learningSeconds(recovery.snapshot.elapsedRunningMs, draft.settings) * 1000,
            recordings_count: count,
            replay_count: 0,
          })

          if (recovery.reason === "duration-reached") {
            track("training_session_completed", {
              session_id: recovery.sessionId,
              total_duration_ms: recovery.snapshot.elapsedRunningMs,
              words_practiced_count: 1,
              words_recorded_count: count > 0 ? 1 : 0,
              words_skipped_count: 0,
              total_recordings: count,
              avg_recording_duration_ms: count ? (draft.captureDurationMs ?? 0) / count : 0,
            })
          } else {
            track("training_session_abandoned", {
              session_id: recovery.sessionId,
              duration_ms: recovery.snapshot.elapsedRunningMs,
              progress_percent:
                recovery.snapshot.elapsedRunningMs / (draft.settings.totalDurationSeconds * 10),
              last_word_id: draft.settings.wordId,
              last_word_name: draft.word.label,
            })
          }
        },
      })
    } while (reconcileAgain)
  })().finally(() => {
    reconciliation = undefined
  })

  return reconciliation
}

export async function startSession(
  wordId: string,
  settings: Omit<SessionSettings, "wordId" | "sourceType" | "libraryEntryId">,
  notification: SessionInput["notification"],
): Promise<SessionSnapshot> {
  await recoverNativeData()
  const data = readData()
  const word = currentWord(data, wordId)

  if (!word || word.archived || !data.profile) {
    throw new Error("Choose a word and profile first")
  }

  if (
    ![settings.totalDurationSeconds, settings.learningDurationSeconds].every(
      (value) => Number.isFinite(value) && value > 0,
    ) ||
    ![settings.restDurationSeconds, settings.stressCareDurationSeconds].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  ) {
    throw new Error("Invalid session duration")
  }

  if (!(await AudioModule.requestRecordingPermissionsAsync()).granted) {
    throw new Error("Microphone permission required")
  }

  const targetAudioUri = await resolveAudio(word)
  const care = settings.stressCareDurationSeconds > 0 ? await stressCareAudio() : []
  const id = `sess_${Date.now().toString(36)}_${randomUUID().replace(/-/g, "").slice(0, 10)}`
  const previousId =
    Object.keys(data.wordAliases).find((key) => data.wordAliases[key] === word.id) ?? word.id
  const sessionSettings: SessionSettings = {
    ...settings,
    wordId: previousId,
    sourceType: word.sourceType,
    libraryEntryId: word.id,
  }
  const draft: SessionDraft = {
    id,
    settings: sessionSettings,
    startedAt: new Date().toISOString(),
    word: {
      label: word.label,
      sourceType: word.sourceType,
      audioUri: word.audioUri,
      ...(word.presetKey ? { presetKey: word.presetKey } : {}),
      libraryEntryId: word.id,
    },
    clientWordId: word.presetKey ? `preset-${word.presetKey}` : word.id,
    parrotSpecies: data.profile.species,
    parrotBirthdate: data.profile.birthDate,
  }

  updateData((next) => {
    next.sessionDrafts[id] = draft
    next.settings.lastSession = sessionSettings
  })

  return engine.start({
    sessionId: id,
    targetAudioUri,
    captureDirectoryUri: captureDirectory(),
    totalDurationMs: settings.totalDurationSeconds * 1000,
    learningDurationMs: settings.learningDurationSeconds * 1000,
    restDurationMs: settings.restDurationSeconds * 1000,
    stressCareDurationMs: settings.stressCareDurationSeconds * 1000,
    stressCareAudioUris: care,
    maxPendingCaptureBytes: 500 * 1024 * 1024,
    vad: defaultVAD,
    recovery: {
      wordId: previousId,
      word: word.label,
      sourceType: word.sourceType,
      libraryEntryId: word.id,
      startedAt: draft.startedAt,
      wordSnapshot: { ...draft.word },
    },
    notification,
  })
}

export { engine }
