import { durationText } from "@/i18n/duration"
import type { Locale } from "@/types/locale"

type Moment = string | number | Date

const toDate = (value: Moment) => (value instanceof Date ? value : new Date(value))

export function formatTime(value: Moment, locale: Locale): string {
	return toDate(value).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
}

export function formatDate(value: Moment, locale: Locale): string {
	return toDate(value).toLocaleDateString(locale, { month: "long", day: "numeric" })
}

export function formatDateWithWeekday(value: Moment, locale: Locale): string {
	return toDate(value).toLocaleDateString(locale, {
		month: "long",
		day: "numeric",
		weekday: "short",
	})
}

export function formatFullDate(value: Moment, locale: Locale): string {
	return toDate(value).toLocaleDateString(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	})
}

export function formatMonth(value: Moment, locale: Locale): string {
	return toDate(value).toLocaleDateString(locale, { year: "numeric", month: "long" })
}

export function formatDateTime(value: Moment, locale: Locale): string {
	return `${formatDate(value, locale)} ${formatTime(value, locale)}`
}

function sameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

export function formatMoment(value: Moment, locale: Locale, now = new Date()): string {
	return sameDay(toDate(value), now) ? formatTime(value, locale) : formatDateTime(value, locale)
}

export function formatRange(start: Moment, end: Moment, locale: Locale): string {
	const from = toDate(start)
	const to = toDate(end)

	return sameDay(from, to)
		? `${formatTime(from, locale)} ~ ${formatTime(to, locale)}`
		: `${formatDateTime(from, locale)} ~ ${formatDateTime(to, locale)}`
}

export function formatDuration(ms: number, locale: Locale): string {
	const minutes = Math.max(0, Math.floor(ms / 60_000))

	return minutes < 1
		? durationText(Math.round(ms / 1000), locale)
		: durationText(minutes * 60, locale)
}

export function formatTimer(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000))
	const hours = Math.floor(total / 3600)
	const minutes = Math.floor((total % 3600) / 60)
	const seconds = total % 60

	const pad = (value: number) => String(value).padStart(2, "0")

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

export function formatClock(time: string, locale: Locale): string {
	const [hours, minutes] = time.split(":").map(Number)
	const date = new Date()

	date.setHours(hours, minutes, 0, 0)

	return formatTime(date, locale)
}
