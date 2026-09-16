import type { AppData } from "@/types/app-data"
import { localDate } from "@/utils/date"

export function ageMonths(birthDate: string | null, now = new Date()): number | null {
	if (!birthDate) {
		return null
	}

	const [year, month, day] = birthDate.split("-").map(Number)

	if (![year, month, day].every(Number.isFinite)) {
		return null
	}

	return Math.max(
		0,
		(now.getFullYear() - year) * 12 +
			now.getMonth() +
			1 -
			month -
			(now.getDate() < day ? 1 : 0),
	)
}

export function profileStats(data: AppData, now = new Date()) {
	const history = Object.values(data.history)
	const days = new Set(
		history
			.filter((session) => session.totalLearningSeconds > 0)
			.map((session) => localDate(new Date(session.endedAt ?? session.startedAt))),
	)
	const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())

	if (!days.has(localDate(cursor))) {
		cursor.setDate(cursor.getDate() - 1)
	}

	let streakDays = 0

	while (days.has(localDate(cursor))) {
		streakDays++
		cursor.setDate(cursor.getDate() - 1)
	}

	return {
		incomplete: data.migration.issues.some(({ key }) =>
			/^(training|history|progress|metrics)(\/|$)/.test(key),
		),
		todaySeconds: history
			.filter(
				(session) =>
					localDate(new Date(session.endedAt ?? session.startedAt)) === localDate(now),
			)
			.reduce((total, session) => total + session.totalLearningSeconds, 0),
		totalSeconds: Object.values(data.progress).reduce(
			(total, progress) => total + progress.totalTrainingSeconds,
			0,
		),
		streakDays,
		sessionCount: history.length,
		wordCount: Object.values(data.words).filter(
			(word) => !word.archived && word.sourceType === "recording",
		).length,
	}
}
