import type  { Locale } from "@/types/locale"

export function durationParts(seconds: number, locale: Locale) {
	const value = Math.max(0, Math.round(seconds))
	const hours = Math.floor(value / 3600)
	const minutes = Math.floor((value % 3600) / 60)
	const remainder = value % 60

	const units = locale === "ko" ? ["시간", "분", "초"] : ["h", "m", "s"]
	const parts: { value: number; unit: string }[] = []

	if (hours > 0) {
		parts.push({ value: hours, unit: units[0] })
	}

	if (minutes > 0) {
		parts.push({ value: minutes, unit: units[1] })
	}

	if (remainder > 0 || value === 0) {
		parts.push({ value: remainder, unit: units[2] })
	}

	return parts
}

export function durationText(seconds: number, locale: Locale) {
	return durationParts(seconds, locale)
		.map(({ value, unit }) => `${value}${unit}`)
		.join(" ")
}
