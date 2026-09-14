import type { Locale } from "@/types/locale"

export function durationText(seconds: number, locale: Locale) {
	const value = Math.max(0, Math.round(seconds))
	const hours = Math.floor(value / 3600)
	const minutes = Math.floor((value % 3600) / 60)
	const remainder = value % 60

	const units = locale === "ko" ? ["시간", "분", "초"] : ["h", "m", "s"]
	const parts: string[] = []

	if (hours > 0) {
		parts.push(`${hours}${units[0]}`)
	}

	if (minutes > 0) {
		parts.push(`${minutes}${units[1]}`)
	}

	if (remainder > 0 || value === 0) {
		parts.push(`${remainder}${units[2]}`)
	}

	return parts.join(" ")
}
