import type { PendingRecovery } from "@modules/session-audio-engine/types"
import {
  AppData,
  currentWord,
  History,
  SessionDraft,
  SessionSettings,
  WordSnapshot,
} from "@/services/data"

export function learningSeconds(elapsedMs: number, settings: SessionSettings) {
  const elapsedSeconds = Math.max(0, Math.min(elapsedMs / 1000, settings.totalDurationSeconds))
  const cycleDurationSeconds =
    settings.learningDurationSeconds +
    settings.restDurationSeconds +
    settings.stressCareDurationSeconds

  if (cycleDurationSeconds <= 0) {
    throw new Error("Invalid session cycle")
  }

  return (
    Math.floor(elapsedSeconds / cycleDurationSeconds) * settings.learningDurationSeconds +
    Math.min(elapsedSeconds % cycleDurationSeconds, settings.learningDurationSeconds)
  )
}

export function recoveryDraft(data: AppData, recovery: PendingRecovery): SessionDraft {
  const saved = data.sessionDrafts[recovery.sessionId]

  if (saved) {
    return saved
  }

  const identity = recovery.recovery
  const word = currentWord(data, identity.wordId) ?? data.words[identity.libraryEntryId ?? ""]
  const supplied = identity.wordSnapshot
  const snapshot: WordSnapshot = {
    label: identity.word,
    sourceType: identity.sourceType,
    audioUri: recovery.targetAudioUri,
    ...(word?.presetKey ? { presetKey: word.presetKey } : {}),
    ...(identity.libraryEntryId ? { libraryEntryId: identity.libraryEntryId } : {}),
  }

  if (supplied && typeof supplied.audioUri === "string") {
    snapshot.audioUri = supplied.audioUri
  }

  if (supplied && typeof supplied.presetKey === "string") {
    snapshot.presetKey = supplied.presetKey
  }

  if (supplied && typeof supplied.transformedAudioUri === "string") {
    snapshot.transformedAudioUri = supplied.transformedAudioUri
  }

  return {
    id: recovery.sessionId,
    startedAt: identity.startedAt,
    word: snapshot,
    settings: {
      wordId: identity.wordId,
      libraryEntryId: identity.libraryEntryId,
      sourceType: identity.sourceType,
      totalDurationSeconds: recovery.totalDurationMs / 1000,
      learningDurationSeconds: recovery.learningDurationMs / 1000,
      restDurationSeconds: recovery.restDurationMs / 1000,
      stressCareDurationSeconds: recovery.stressCareDurationMs / 1000,
    },
    clientWordId: snapshot.presetKey
      ? `preset-${snapshot.presetKey}`
      : (identity.libraryEntryId ?? identity.wordId),
    parrotSpecies: data.profile?.species ?? null,
    parrotBirthdate: data.profile?.birthDate ?? null,
  }
}

/** Credit an ID at most once; callers clear native recovery only after this document is durable. */
export function creditRecovery(data: AppData, recovery: PendingRecovery): History | undefined {
  const existing = data.history[recovery.sessionId]

  if (existing) {
    return existing
  }

  const elapsedRunningMs = recovery.snapshot.elapsedRunningMs

  if (recovery.reason !== "duration-reached" && elapsedRunningMs < 300_000) {
    return undefined
  }

  const draft = recoveryDraft(data, recovery)
  const cycleDurationSeconds =
    draft.settings.learningDurationSeconds +
    draft.settings.restDurationSeconds +
    draft.settings.stressCareDurationSeconds

  if (cycleDurationSeconds <= 0) {
    throw new Error("Invalid recovery cycle")
  }

  const endedAt = recovery.snapshot.savedAt
  const totalLearningSeconds = learningSeconds(elapsedRunningMs, draft.settings)
  const history: History = {
    ...draft.settings,
    id: recovery.sessionId,
    word: draft.word,
    startedAt: draft.startedAt,
    endedAt,
    completedCycles: Math.floor(
      Math.min(elapsedRunningMs / 1000, draft.settings.totalDurationSeconds) / cycleDurationSeconds,
    ),
    totalLearningSeconds,
  }

  data.history[history.id] = history
  const metricsId = history.libraryEntryId ?? data.wordAliases[history.wordId] ?? history.wordId
  const metrics = data.settings.wordMetrics[metricsId]

  data.settings.wordMetrics[metricsId] = {
    word_id: metricsId,
    word_name: draft.word.label,
    lifetime_practice_count: (metrics?.lifetime_practice_count ?? 0) + 1,
    lifetime_practice_duration_ms:
      (metrics?.lifetime_practice_duration_ms ?? 0) + totalLearningSeconds * 1000,
    lifetime_recording_count: metrics?.lifetime_recording_count ?? 0,
    last_practiced_at_iso: endedAt,
  }
  const previous = data.progress[history.wordId]

  data.progress[history.wordId] = {
    ...previous,
    wordId: history.wordId,
    totalTrainingSeconds: (previous?.totalTrainingSeconds ?? 0) + totalLearningSeconds,
    sessionCount: (previous?.sessionCount ?? 0) + 1,
    updatedAt: endedAt,
  }

  return history
}
