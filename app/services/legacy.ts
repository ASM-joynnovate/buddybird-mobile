import {
  AppData,
  Capture,
  emptyData,
  History,
  Locale,
  Profile,
  SessionSettings,
  Word,
  WordSnapshot,
} from "@/services/data"

type ObjectValue = Record<string, unknown>

const prefixes = ["@buddybird/", "@pethub/"]

export function requireRecord(value: unknown, field: string): ObjectValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ${field}`)
  }

  return value as ObjectValue
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}`)
  }

  return value
}

function requireNonnegativeNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${field}`)
  }

  return value
}

function readNullableText(value: unknown, field: string): string | null {
  return value === null ? null : requireText(value, field)
}

function requireChoice<T extends string>(value: unknown, choices: readonly T[], field: string): T {
  if (!choices.includes(value as T)) {
    throw new Error(`Invalid ${field}`)
  }

  return value as T
}

function requireList(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${field}`)
  }

  return value
}

function parseSourceType(value: unknown) {
  return requireChoice(value, ["preset", "recording"] as const, "sourceType")
}

function readOptionalText(value: unknown, field: string) {
  return value === undefined ? undefined : requireText(value, field)
}

function parseLegacyProfile(value: unknown): Profile {
  const profileRecord = requireRecord(value, "profile")
  let birthDate =
    profileRecord.birthDate === undefined
      ? null
      : readNullableText(profileRecord.birthDate, "birthDate")

  if (profileRecord.birthDate === undefined && profileRecord.ageMonths !== undefined) {
    const date = new Date(requireText(profileRecord.createdAt, "profile.createdAt"))
    const age = requireNonnegativeNumber(profileRecord.ageMonths, "ageMonths")

    if (!Number.isInteger(age) || !Number.isFinite(date.getTime())) {
      throw new Error("Invalid historical profile age")
    }

    const birth = new Date(date.getFullYear(), date.getMonth() - age, 1)

    birthDate = `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-01`
  }

  let species = requireText(profileRecord.species, "species")

  if (species === "parakeet") {
    species = "budgie"
  }

  if (
    species === "custom" &&
    typeof profileRecord.customSpecies === "string" &&
    profileRecord.customSpecies.trim()
  ) {
    species = profileRecord.customSpecies.trim()
  }

  return {
    id: requireText(profileRecord.id, "profile.id"),
    name: requireText(profileRecord.name, "profile.name"),
    species,
    birthDate,
    photoUri: readOptionalText(profileRecord.photoUri, "photoUri"),
    createdAt: requireText(profileRecord.createdAt, "createdAt"),
    updatedAt: requireText(profileRecord.updatedAt, "updatedAt"),
  }
}

function readWordSnapshot(wordRecord: ObjectValue): WordSnapshot {
  return {
    label: requireText(wordRecord.label, "word.label"),
    sourceType: parseSourceType(wordRecord.sourceType),
    audioUri: requireText(wordRecord.audioUri, "word.audioUri"),
    presetKey: readOptionalText(wordRecord.presetKey, "presetKey"),
    transformedAudioUri: readOptionalText(wordRecord.transformedAudioUri, "transformedAudioUri"),
    libraryEntryId: readOptionalText(wordRecord.libraryEntryId, "libraryEntryId"),
  }
}

function parseLegacyWord(value: unknown, id: string, archived = false): Word {
  const wordRecord = requireRecord(value, `word ${id}`)

  if (wordRecord.id !== id) {
    throw new Error(`Word key mismatch: ${id}`)
  }

  const tags: Record<string, string> = { 인사: "greeting", 음식: "food", 이름: "name", 기타: "etc" }
  const tag =
    archived && wordRecord.tag === undefined
      ? "etc"
      : (tags[String(wordRecord.tag)] ?? wordRecord.tag)

  return {
    id,
    ...readWordSnapshot(wordRecord),
    tag: requireChoice(tag, ["greeting", "food", "name", "etc"] as const, "tag"),
    createdAt: requireText(wordRecord.createdAt, "word.createdAt"),
    updatedAt: requireText(wordRecord.updatedAt, "word.updatedAt"),
    ...(archived ? { archived: true } : {}),
  }
}

function parseLegacySettings(value: unknown): SessionSettings {
  const sessionRecord = requireRecord(value, "session settings")

  return {
    wordId: requireText(sessionRecord.wordId, "wordId"),
    sourceType: parseSourceType(sessionRecord.sourceType),
    libraryEntryId: readOptionalText(sessionRecord.libraryEntryId, "libraryEntryId"),
    totalDurationSeconds: requireNonnegativeNumber(
      sessionRecord.totalDurationSeconds,
      "totalDurationSeconds",
    ),
    learningDurationSeconds: requireNonnegativeNumber(
      sessionRecord.learningDurationSeconds,
      "learningDurationSeconds",
    ),
    restDurationSeconds: requireNonnegativeNumber(
      sessionRecord.restDurationSeconds,
      "restDurationSeconds",
    ),
    stressCareDurationSeconds:
      sessionRecord.stressCareDurationSeconds === undefined
        ? 0
        : requireNonnegativeNumber(
            sessionRecord.stressCareDurationSeconds,
            "stressCareDurationSeconds",
          ),
  }
}

/** Translate documented wire records. Every original byte is also archived by migration. */
export function convertLegacy(values: Record<string, string>, locale: Locale): AppData {
  const data = emptyData(locale)

  function readRawValue(key: string): string | undefined {
    for (const prefix of prefixes) {
      if (Object.hasOwn(values, prefix + key)) {
        return values[prefix + key]
      }
    }

    return undefined
  }

  function readParsedValue(key: string): unknown {
    const value = readRawValue(key)

    return value === undefined ? undefined : JSON.parse(value)
  }

  function readRecord(key: string): ObjectValue | undefined {
    const value = readParsedValue(key)

    return value === undefined ? undefined : requireRecord(value, key)
  }

  const savedProfile = readParsedValue("parrot-profile")

  if (savedProfile !== undefined) {
    data.profile = parseLegacyProfile(savedProfile)
  }

  const savedLocale = readRawValue("locale")

  if (savedLocale !== undefined) {
    data.settings.locale = requireChoice(savedLocale, ["ko", "en"] as const, "locale")
  }

  const analytics = readRawValue("analytics-consent")

  if (analytics !== undefined) {
    data.settings.analyticsConsent = requireChoice(
      analytics,
      ["unknown", "granted", "denied", "not_applicable"] as const,
      "analytics-consent",
    )
  }

  const library = readRecord("wordLibrary")

  if (library) {
    if (library.version !== 1) {
      throw new Error("Unsupported word library version")
    }

    for (const [id, value] of Object.entries(requireRecord(library.entriesById, "entriesById"))) {
      data.words[id] = parseLegacyWord(value, id)
    }
  }

  const training = readRecord("training-store")
  const trainingWords = training ? requireRecord(training.wordsById, "wordsById") : {}

  if (training) {
    if (training.version !== 1) {
      throw new Error("Unsupported training version")
    }

    // Recordings are preserved in the immutable source archive; references below keep original media.
    requireRecord(training.recordingsById, "recordingsById")

    for (const [id, value] of Object.entries(trainingWords)) {
      const trainingWord = requireRecord(value, `training word ${id}`)
      const libraryId = readOptionalText(trainingWord.libraryEntryId, "libraryEntryId")

      if (libraryId && data.words[libraryId]) {
        data.wordAliases[id] = libraryId
      } else {
        if (data.words[id]) {
          throw new Error(`Ambiguous word identity: ${id}`)
        }

        data.words[id] = parseLegacyWord(trainingWord, id, true)
      }
    }

    for (const [id, value] of Object.entries(
      requireRecord(training.sessionsById, "sessionsById"),
    )) {
      const historyRecord = requireRecord(value, `session ${id}`)

      if (historyRecord.id !== id) {
        throw new Error(`Session key mismatch: ${id}`)
      }

      const session = parseLegacySettings(historyRecord)
      const original = trainingWords[session.wordId]
      const fallback = data.words[session.libraryEntryId ?? session.wordId]

      if (!original && !fallback) {
        throw new Error(`Missing historical word: ${session.wordId}`)
      }

      const historyEntry: History = {
        ...session,
        id,
        completedCycles: requireNonnegativeNumber(historyRecord.completedCycles, "completedCycles"),
        totalLearningSeconds: requireNonnegativeNumber(
          historyRecord.totalLearningSeconds,
          "totalLearningSeconds",
        ),
        startedAt: requireText(historyRecord.startedAt, "startedAt"),
        endedAt: readOptionalText(historyRecord.endedAt, "endedAt"),
        word: readWordSnapshot(requireRecord(original ?? fallback, "historical word")),
      }

      data.history[id] = historyEntry
    }

    for (const [id, value] of Object.entries(
      requireRecord(training.wordProgressByWordId, "wordProgressByWordId"),
    )) {
      const progressRecord = requireRecord(value, `progress ${id}`)

      if (progressRecord.wordId !== id) {
        throw new Error(`Progress key mismatch: ${id}`)
      }

      data.progress[id] = {
        wordId: id,
        totalTrainingSeconds: requireNonnegativeNumber(
          progressRecord.totalTrainingSeconds,
          "totalTrainingSeconds",
        ),
        sessionCount: requireNonnegativeNumber(progressRecord.sessionCount, "sessionCount"),
        successMarkedAt: readOptionalText(progressRecord.successMarkedAt, "successMarkedAt"),
        updatedAt: requireText(progressRecord.updatedAt, "updatedAt"),
      }
    }

    if (training.lastSessionSettings !== undefined) {
      data.settings.lastSession = parseLegacySettings(training.lastSessionSettings)
    }
  }

  const captures = readRecord("follow-along-captures")

  if (captures) {
    for (const [id, value] of Object.entries(
      requireRecord(captures.capturesById, "capturesById"),
    )) {
      const captureRecord = requireRecord(value, `capture ${id}`)

      if (captureRecord.id !== id) {
        throw new Error(`Capture key mismatch: ${id}`)
      }

      const wordId = requireText(captureRecord.wordId, "capture.wordId")
      const original = trainingWords[wordId]
        ? requireRecord(trainingWords[wordId], "capture word")
        : data.words[data.wordAliases[wordId] ?? wordId]
      const fallbackId = original?.presetKey
        ? `preset-${String(original.presetKey)}`
        : ((original && "libraryEntryId" in original ? original.libraryEntryId : undefined) ??
          data.wordAliases[wordId] ??
          wordId)
      const capture: Capture = {
        id,
        wordId,
        sessionId: requireText(captureRecord.sessionId, "capture.sessionId"),
        cycle: requireNonnegativeNumber(captureRecord.cycle, "capture.cycle"),
        clientWordId:
          captureRecord.clientWordId === undefined
            ? String(fallbackId)
            : requireText(captureRecord.clientWordId, "clientWordId"),
        parrotSpecies:
          captureRecord.parrotSpecies === undefined
            ? (data.profile?.species ?? null)
            : readNullableText(captureRecord.parrotSpecies, "parrotSpecies"),
        parrotBirthdate:
          captureRecord.parrotBirthdate === undefined
            ? (data.profile?.birthDate ?? null)
            : readNullableText(captureRecord.parrotBirthdate, "parrotBirthdate"),
        phase:
          captureRecord.phase === undefined
            ? "learning"
            : requireChoice(captureRecord.phase, ["learning", "rest"] as const, "phase"),
        capturedAt: requireText(captureRecord.capturedAt, "capturedAt"),
        uri: requireText(captureRecord.uri, "capture.uri"),
        fileName: requireText(captureRecord.fileName, "fileName"),
        sizeBytes: requireNonnegativeNumber(captureRecord.sizeBytes, "sizeBytes"),
        segments: requireList(captureRecord.segments, "segments").map((value) => {
          const segmentRecord = requireRecord(value, "segment")
          const startMs = requireNonnegativeNumber(segmentRecord.startMs, "startMs")
          const endMs = requireNonnegativeNumber(segmentRecord.endMs, "endMs")

          if (endMs < startMs) {
            throw new Error("Invalid speech interval")
          }

          return { startMs, endMs }
        }),
      }

      data.captures[id] = capture
    }
  }

  const consent = readRecord("upload-consent")

  if (consent) {
    data.settings.uploadConsent = {
      status: requireChoice(
        consent.status,
        ["unknown", "granted", "denied"] as const,
        "upload consent",
      ),
      decidedAt: readNullableText(consent.decidedAt, "decidedAt"),
      noticeVersion: requireNonnegativeNumber(consent.noticeVersion, "noticeVersion"),
    }
  }

  const update = readRecord("app-update")

  if (update) {
    data.settings.update = {
      dismissedVersion: readNullableText(update.dismissedVersion, "dismissedVersion"),
      lastCheckedAt:
        update.lastCheckedAt === null
          ? null
          : requireNonnegativeNumber(update.lastCheckedAt, "lastCheckedAt"),
    }
  }

  const feedback = readRecord("feedback-prompt")

  if (feedback) {
    if (feedback.version !== 1) {
      throw new Error("Unsupported feedback version")
    }

    data.settings.feedback = {
      version: 1,
      lastCountedDate: readNullableText(feedback.lastCountedDate, "lastCountedDate"),
      dayCount: requireNonnegativeNumber(feedback.dayCount, "dayCount"),
      thresholdIndex: requireNonnegativeNumber(feedback.thresholdIndex, "thresholdIndex"),
    }
  }

  const push = readRecord("fcm-registration")

  if (push) {
    data.settings.push = {
      token: readNullableText(push.token, "token"),
      authorizationStatus: requireChoice(
        push.authorizationStatus,
        ["not_determined", "denied", "authorized", "provisional", "ephemeral"] as const,
        "authorizationStatus",
      ),
      updatedAt: requireText(push.updatedAt, "push.updatedAt"),
    }
  }

  const receipts = readParsedValue("fcm-message-receipts")

  if (receipts !== undefined) {
    data.settings.receipts = requireList(receipts, "receipts").map((value) => {
      const receiptRecord = requireRecord(value, "receipt")

      return {
        messageId: readNullableText(receiptRecord.messageId, "messageId"),
        from: readNullableText(receiptRecord.from, "from"),
        sentTime:
          receiptRecord.sentTime === null
            ? null
            : requireNonnegativeNumber(receiptRecord.sentTime, "sentTime"),
        source: requireChoice(
          receiptRecord.source,
          ["foreground", "background", "notification_opened"] as const,
          "receipt.source",
        ),
        receivedAt: requireText(receiptRecord.receivedAt, "receivedAt"),
      }
    })
  }

  const metrics = readRecord("analytics-word-metrics")

  if (metrics) {
    for (const [id, value] of Object.entries(metrics)) {
      const wordMetrics = requireRecord(value, `metrics ${id}`)

      data.settings.wordMetrics[id] = {
        word_id: requireText(wordMetrics.word_id, "word_id"),
        word_name: requireText(wordMetrics.word_name, "word_name"),
        lifetime_practice_count: requireNonnegativeNumber(
          wordMetrics.lifetime_practice_count,
          "lifetime_practice_count",
        ),
        lifetime_practice_duration_ms: requireNonnegativeNumber(
          wordMetrics.lifetime_practice_duration_ms,
          "lifetime_practice_duration_ms",
        ),
        lifetime_recording_count: requireNonnegativeNumber(
          wordMetrics.lifetime_recording_count,
          "lifetime_recording_count",
        ),
        last_practiced_at_iso: readNullableText(
          wordMetrics.last_practiced_at_iso,
          "last_practiced_at_iso",
        ),
      }
    }
  }

  data.pendingWords = Object.values(data.words)
    .filter((storedWord) => storedWord.sourceType === "recording" && !storedWord.archived)
    .map((storedWord) => storedWord.id)

  return data
}
