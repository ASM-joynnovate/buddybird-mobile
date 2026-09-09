export type Locale = "ko" | "en"

export type SourceType = "preset" | "recording"

export type UploadConsent = {
  status: "unknown" | "granted" | "denied"
  decidedAt: string | null
  noticeVersion: number
}

export type AnalyticsConsent = "unknown" | "granted" | "denied" | "not_applicable"

export type Profile = {
  id: string
  name: string
  species: string
  birthDate: string | null
  photoUri?: string
  createdAt: string
  updatedAt: string
}

export type Word = {
  id: string
  label: string
  tag: "greeting" | "food" | "name" | "etc"
  sourceType: SourceType
  audioUri: string
  presetKey?: string
  transformedAudioUri?: string
  createdAt: string
  updatedAt: string
  archived?: boolean
}

export type WordSnapshot = Pick<
  Word,
  "label" | "sourceType" | "audioUri" | "presetKey" | "transformedAudioUri"
> & { libraryEntryId?: string }

export type SessionSettings = {
  wordId: string
  sourceType: SourceType
  libraryEntryId?: string
  totalDurationSeconds: number
  learningDurationSeconds: number
  restDurationSeconds: number
  stressCareDurationSeconds: number
}

export type History = SessionSettings & {
  id: string
  completedCycles: number
  totalLearningSeconds: number
  startedAt: string
  endedAt?: string
  word: WordSnapshot
}

export type Progress = {
  wordId: string
  totalTrainingSeconds: number
  sessionCount: number
  successMarkedAt?: string
  updatedAt: string
}

export type Capture = {
  id: string
  sessionId: string
  wordId: string
  clientWordId: string
  parrotSpecies: string | null
  parrotBirthdate: string | null
  cycle: number
  phase: "learning" | "rest"
  capturedAt: string
  uri: string
  fileName: string
  segments: { startMs: number; endMs: number }[]
  sizeBytes: number
}

export type WordMetrics = {
  word_id: string
  word_name: string
  lifetime_practice_count: number
  lifetime_practice_duration_ms: number
  lifetime_recording_count: number
  last_practiced_at_iso: string | null
}

export type PushAuthorization =
  "not_determined" | "denied" | "authorized" | "provisional" | "ephemeral"

export type PushReceipt = {
  messageId: string | null
  from: string | null
  sentTime: number | null
  source: "foreground" | "background" | "notification_opened"
  receivedAt: string
}

export type SessionDraft = {
  captureCount?: number
  captureDurationMs?: number
  id: string
  settings: SessionSettings
  word: WordSnapshot
  startedAt: string
  clientWordId: string
  parrotSpecies: string | null
  parrotBirthdate: string | null
}

export type AppData = {
  version: 1
  profile: Profile | null
  words: Record<string, Word>
  /** Old training IDs remain stable references to the current canonical word. */
  wordAliases: Record<string, string>
  history: Record<string, History>
  progress: Record<string, Progress>
  captures: Record<string, Capture>
  sessionDrafts: Record<string, SessionDraft>
  nativeCaptureReceipts: string[]
  pendingWords: string[]
  pendingFileDeletes: string[]
  settings: {
    locale: Locale
    analyticsConsent: AnalyticsConsent
    uploadConsent: UploadConsent
    lastSession?: SessionSettings
    update: { dismissedVersion: string | null; lastCheckedAt: number | null }
    feedback: {
      version: 1
      lastCountedDate: string | null
      dayCount: number
      thresholdIndex: number
    }
    push: { token: string | null; authorizationStatus: PushAuthorization; updatedAt: string } | null
    receipts: PushReceipt[]
    wordMetrics: Record<string, WordMetrics>
  }
}

export function emptyData(locale: Locale): AppData {
  return {
    version: 1,
    profile: null,
    words: {},
    wordAliases: {},
    history: {},
    progress: {},
    captures: {},
    sessionDrafts: {},
    nativeCaptureReceipts: [],
    pendingWords: [],
    pendingFileDeletes: [],
    settings: {
      locale,
      analyticsConsent: "unknown",
      uploadConsent: { status: "unknown", decidedAt: null, noticeVersion: 1 },
      update: { dismissedVersion: null, lastCheckedAt: null },
      feedback: { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
      push: null,
      receipts: [],
      wordMetrics: {},
    },
  }
}

export function currentWord(data: AppData, id: string) {
  return data.words[data.wordAliases[id] ?? id]
}
