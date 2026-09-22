import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { sessionsInRangeQueryOptions } from "@/hooks/apis/mocks"
import { sessionEventsQueryOptions, sessionSoundsQueryOptions } from "@/hooks/apis/sessions"
import { wordsQueryOptions } from "@/hooks/apis/words"
import type { Session, SessionEvent } from "@/types/apis/sessions"
import { localDate } from "@/utils/date"

export type DayMark = { session: boolean; emergency: boolean }

export type DayBar = { id: string; from: number; to: number; running: boolean }

export type DayAlarm = { id: string; at: number }

export type CalendarSession = {
	session: Session
	wordName: string | null
	mimicryCount: number
	emergencyCount: number
}

export type RecordsCalendar = {
	month: Date
	selected: string
	select(key: string): void
	previousMonth(): void
	nextMonth(): void
	canGoNext: boolean
	marks: ReadonlyMap<string, DayMark>
	dayFrom: number
	daySessions: CalendarSession[]
	bars: DayBar[]
	alarms: DayAlarm[]
	now: number
	query: UseQueryResult<Session[]>
}

function monthStart(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, count: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function dayStart(key: string): Date {
	const [year, month, day] = key.split("-").map(Number)

	return new Date(year, month - 1, day)
}

export function sessionEnd(session: Session, now: number): number {
	return session.period.ended_at ? Date.parse(session.period.ended_at) : now
}

function emergencyEvents(events: readonly SessionEvent[]): SessionEvent[] {
	return events.filter((event) => event.kind === "emergency_detected")
}

function markDays(
	sessions: readonly Session[],
	eventsBySession: ReadonlyMap<string, readonly SessionEvent[]>,
	now: number,
): ReadonlyMap<string, DayMark> {
	const marks = new Map<string, DayMark>()

	for (const session of sessions) {
		const end = sessionEnd(session, now)
		const hasEmergency = emergencyEvents(eventsBySession.get(session.id) ?? []).length > 0
		const cursor = new Date(Date.parse(session.period.started_at))

		cursor.setHours(0, 0, 0, 0)

		while (cursor.getTime() < end) {
			const key = localDate(cursor)
			const current = marks.get(key)

			marks.set(key, {
				session: true,
				emergency: Boolean(current?.emergency) || hasEmergency,
			})
			cursor.setDate(cursor.getDate() + 1)
		}
	}

	return marks
}

export function useRecordsCalendar(): RecordsCalendar {
	const [month, setMonth] = useState(() => monthStart(new Date()))
	const [selected, setSelected] = useState(() => localDate())
	const [openedAt] = useState(() => Date.now())
	const query = useQuery(sessionsInRangeQueryOptions(month, addMonths(month, 1)))
	const now = Math.max(openedAt, query.dataUpdatedAt)
	const sessions = useMemo(() => query.data ?? [], [query.data])
	const eventsBySession = useSessionEvents(sessions)
	const marks = useMemo(
		() => markDays(sessions, eventsBySession, now),
		[sessions, eventsBySession, now],
	)

	const from = dayStart(selected).getTime()
	const to = addDay(from)
	const sessionsOfDay = sessions
		.filter(
			(session) =>
				Date.parse(session.period.started_at) < to && sessionEnd(session, now) > from,
		)
		.sort((a, b) => Date.parse(a.period.started_at) - Date.parse(b.period.started_at))
	const daySessions = useCalendarSessions(sessionsOfDay, eventsBySession)
	const bars: DayBar[] = sessionsOfDay.map((session) => ({
		id: session.id,
		from: Math.max(from, Date.parse(session.period.started_at)),
		to: Math.min(to, sessionEnd(session, now)),
		running: session.status === "running",
	}))
	const alarms = dayAlarms(sessionsOfDay, eventsBySession, from, to)

	const isCurrentMonth = month.getTime() === monthStart(new Date()).getTime()

	function moveMonth(count: number) {
		const next = addMonths(month, count)
		const current = monthStart(new Date()).getTime() === next.getTime()

		setMonth(next)
		setSelected(localDate(current ? new Date() : next))
	}

	return {
		month,
		selected,
		select: setSelected,
		previousMonth: () => moveMonth(-1),
		nextMonth: () => moveMonth(1),
		canGoNext: !isCurrentMonth,
		marks,
		dayFrom: from,
		daySessions,
		bars,
		alarms,
		now,
		query,
	}
}

function addDay(from: number): number {
	const next = new Date(from)

	next.setDate(next.getDate() + 1)

	return next.getTime()
}

function useSessionEvents(
	sessions: readonly Session[],
): ReadonlyMap<string, readonly SessionEvent[]> {
	const results = useQueries({
		queries: sessions.map((session) => sessionEventsQueryOptions(session.id)),
	})

	return new Map(sessions.map((session, index) => [session.id, results[index]?.data ?? []]))
}

function useCalendarSessions(
	sessions: readonly Session[],
	eventsBySession: ReadonlyMap<string, readonly SessionEvent[]>,
): CalendarSession[] {
	const words = useQuery(wordsQueryOptions())
	const soundResults = useQueries({
		queries: sessions.map((session) => sessionSoundsQueryOptions(session.id)),
	})

	return sessions.map((session, index) => ({
		session,
		wordName: words.data?.find((word) => word.id === session.settings.word_id)?.name ?? null,
		mimicryCount: (soundResults[index]?.data ?? []).filter((sound) => sound.judgment?.word_id)
			.length,
		emergencyCount: emergencyEvents(eventsBySession.get(session.id) ?? []).length,
	}))
}

function dayAlarms(
	sessions: readonly Session[],
	eventsBySession: ReadonlyMap<string, readonly SessionEvent[]>,
	from: number,
	to: number,
): DayAlarm[] {
	return sessions.flatMap((session) =>
		emergencyEvents(eventsBySession.get(session.id) ?? []).flatMap((event) => {
			const at = Date.parse(event.occurred_at)

			return at >= from && at < to ? [{ id: event.id, at }] : []
		}),
	)
}
