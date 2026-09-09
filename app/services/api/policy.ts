import type { AppData, Locale, UploadConsent } from "@/services/data"

export const UPDATE_INTERVAL = 6 * 60 * 60 * 1000

export type UpdatePolicy = {
  latestVersion: string
  minimumVersion: string
  notes: Partial<Record<Locale, string[]>>
}

export type UpdateDecision = { latestVersion: string; forced: boolean; notes: string[] } | null

export function versionParts(value: string): number[] | null {
  const match = /^[vV]?(\d+(?:\.\d+){0,2})(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.exec(
    value.trim(),
  )

  if (!match) {
    return null
  }

  const parts = match[1].split(".").map(Number)

  return parts.every(Number.isSafeInteger) ? [...parts, 0, 0].slice(0, 3) : null
}

export function compareVersions(a: string, b: string): number | null {
  const left = versionParts(a)
  const right = versionParts(b)

  if (!left || !right) {
    return null
  }

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) {
      return Math.sign(left[i] - right[i])
    }
  }

  return 0
}

export function parseReleaseNotes(raw: string): UpdatePolicy["notes"] {
  try {
    const value: unknown = JSON.parse(raw)

    if (!value || typeof value !== "object") {
      return {}
    }

    const notes: UpdatePolicy["notes"] = {}

    for (const locale of ["ko", "en"] as const) {
      const list = (value as Record<string, unknown>)[locale]

      if (Array.isArray(list)) {
        notes[locale] = list.filter((item): item is string => typeof item === "string")
      }
    }

    return notes
  } catch {
    return {}
  }
}

export function evaluateUpdate(
  policy: UpdatePolicy,
  installed: string,
  dismissed: string | null,
  locale: Locale,
): UpdateDecision {
  if (!policy.latestVersion || compareVersions(installed, policy.latestVersion) === null) {
    return null
  }

  const minimum = policy.minimumVersion ? compareVersions(installed, policy.minimumVersion) : 0

  if (minimum === null) {
    return null
  }

  const forced = minimum < 0

  if (
    !forced &&
    (compareVersions(installed, policy.latestVersion)! >= 0 || dismissed === policy.latestVersion)
  ) {
    return null
  }

  return {
    latestVersion: policy.latestVersion,
    forced,
    notes: policy.notes[locale] ?? policy.notes.en ?? [],
  }
}

export function shouldCheckUpdate(
  lastCheckedAt: number | null,
  coldStart: boolean,
  now = Date.now(),
) {
  return coldStart || lastCheckedAt === null || now - lastCheckedAt >= UPDATE_INTERVAL
}

export function shouldPromptUploadConsent(
  consent: UploadConsent,
  coldStart: boolean,
  now = Date.now(),
) {
  if (consent.status === "granted") {
    return false
  }

  if (consent.status === "unknown" || !consent.decidedAt) {
    return true
  }

  const decided = Date.parse(consent.decidedAt)

  return coldStart && (!Number.isFinite(decided) || now - decided >= 30 * 86400_000)
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function feedbackThreshold(state: AppData["settings"]["feedback"]) {
  return [3, 5, 7, 10][Math.min(Math.max(state.thresholdIndex, 0), 3)]
}

export function countFeedbackDay(state: AppData["settings"]["feedback"], date = localDate()) {
  if (state.lastCountedDate !== date) {
    state.lastCountedDate = date
    state.dayCount++
  }
}

export function consumeFeedbackPrompt(state: AppData["settings"]["feedback"]) {
  state.dayCount = 0
  state.thresholdIndex = Math.min(state.thresholdIndex + 1, 3)
}

export function validateFeedback(message: string) {
  const trimmed = message.trim()

  if (!trimmed || trimmed.length > 1000) {
    throw new Error("Feedback must contain 1–1000 characters")
  }

  return trimmed
}

/** Native auth persists the user; this only coalesces concurrent acquisition. */
export function coalesceIdentity(current: () => string | null, signIn: () => Promise<string>) {
  let pending: Promise<string> | null = null

  return () => {
    const uid = current()

    if (uid) {
      return Promise.resolve(uid)
    }

    if (!pending) {
      pending = signIn().finally(() => {
        pending = null
      })
    }

    return pending
  }
}

export function newestReceipts(receipts: import("../data").PushReceipt[]) {
  const unique = new Map(receipts.map((receipt) => [JSON.stringify(receipt), receipt]))

  return [...unique.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 20)
}
