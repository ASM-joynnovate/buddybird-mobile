import { UpdateDecision, UpdatePolicy } from "@/types/apis/update"
import type { Locale } from "@/types/locale"

export const UPDATE_INTERVAL = 6 * 60 * 60 * 1000

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
		(compareVersions(installed, policy.latestVersion)! >= 0 ||
			dismissed === policy.latestVersion)
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
