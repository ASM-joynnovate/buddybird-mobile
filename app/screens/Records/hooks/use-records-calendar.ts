import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import type { Session } from "@/apis/sessions"
import { sessionsQueryOptions, timelineQueryOptions } from "@/hooks/apis/sessions"
import { localDate } from "@/utils/date"

export type DayMark = { session: boolean; emergency: boolean }

export type DayBar = { id: string; from: number; to: number; running: boolean }

export type DayAlarm = { id: string; at: number }

export type RecordsCalendar = {
	month: Date
	selected: string
	select(key: string): void
	previousMonth(): void
	nextMonth(): void
	canGoNext: boolean
	marks: ReadonlyMap<string, DayMark>
	dayFrom: number
	daySessions: Session[]
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
	return session.ended_at ? Date.parse(session.ended_at) : now
}

function markDays(sessions: readonly Session[], now: number): ReadonlyMap<string, DayMark> {
	const marks = new Map<string, DayMark>()

	for (const session of sessions) {
		const end = sessionEnd(session, now)
		const cursor = new Date(Date.parse(session.started_at))

		cursor.setHours(0, 0, 0, 0)

		while (cursor.getTime() < end) {
			const key = localDate(cursor)
			const current = marks.get(key)

			marks.set(key, {
				session: true,
				emergency: Boolean(current?.emergency) || session.emergency_count > 0,
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
	const query = useQuery(sessionsQueryOptions(month, addMonths(month, 1)))
	const now = Math.max(openedAt, query.dataUpdatedAt)
	const sessions = useMemo(() => query.data ?? [], [query.data])
	const marks = useMemo(() => markDays(sessions, now), [sessions, now])
	const from = dayStart(selected).getTime()
	const to = addDay(from)
	const daySessions = sessions
		.filter((session) => Date.parse(session.started_at) < to && sessionEnd(session, now) > from)
		.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at))
	const bars: DayBar[] = daySessions.map((session) => ({
		id: session.id,
		from: Math.max(from, Date.parse(session.started_at)),
		to: Math.min(to, sessionEnd(session, now)),
		running: session.status === "running",
	}))
	const alarms = useDayAlarms(daySessions, from, to)
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

function useDayAlarms(sessions: readonly Session[], from: number, to: number): DayAlarm[] {
	const withAlarms = sessions.filter((session) => session.emergency_count > 0)
	const timelines = useQueries({
		queries: withAlarms.map((session) => timelineQueryOptions(session.id)),
	})

	return timelines.flatMap((result) =>
		(result.data?.events ?? []).flatMap((event) => {
			const at = Date.parse(event.occurred_at)

			return event.kind === "emergency_detected" && at >= from && at < to
				? [{ id: event.id, at }]
				: []
		}),
	)
}
