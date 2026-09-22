import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import type { FlatList } from "react-native"

import type { EmergencyBrief } from "@/apis/emergencies"
import type { Session, SessionEvent, Sound, Timeline } from "@/apis/sessions"
import { sessionQueryOptions, timelineQueryOptions } from "@/hooks/apis/sessions"

export type TimelineFilter = "all" | "sounds" | "emergencies" | "connection"

export type TimelineItem =
	| { key: string; kind: "event"; at: number; event: SessionEvent }
	| { key: string; kind: "sound"; at: number; sound: Sound }
	| { key: string; kind: "emergency"; at: number; emergency: EmergencyBrief }

export const timelineFilters: readonly TimelineFilter[] = [
	"all",
	"sounds",
	"emergencies",
	"connection",
]

const REFRESH_MS = 10_000
const connectionKinds = new Set(["station_disconnected", "station_reconnected"])

function eventItem(event: SessionEvent): TimelineItem {
	const at = Date.parse(event.occurred_at)

	return event.kind === "emergency_detected" && event.emergency
		? { key: event.emergency.id, kind: "emergency", at, emergency: event.emergency }
		: { key: event.id, kind: "event", at, event }
}

function buildTimeline(timeline: Timeline): TimelineItem[] {
	return [
		...timeline.events.map(eventItem),
		...timeline.sounds.map((sound): TimelineItem => ({
			key: sound.id,
			kind: "sound",
			at: Date.parse(sound.captured_at),
			sound,
		})),
	].sort((a, b) => a.at - b.at)
}

function matches(item: TimelineItem, filter: TimelineFilter): boolean {
	switch (filter) {
		case "all":
			return true
		case "sounds":
			return item.kind === "sound"
		case "emergencies":
			return item.kind === "emergency"
		case "connection":
			return item.kind === "event" && connectionKinds.has(item.event.kind)
	}
}

function nearestIndex(items: readonly TimelineItem[], at: number): number {
	return items.reduce(
		(best, item, index) =>
			Math.abs(item.at - at) < Math.abs(items[best].at - at) ? index : best,
		0,
	)
}

export type SessionDetail = {
	session: UseQueryResult<Session>
	timeline: UseQueryResult<Timeline>
	running: boolean
	end: number
	items: TimelineItem[]
	filter: TimelineFilter
	setFilter(filter: TimelineFilter): void
	highlightedKey: string | null
	cursor: number | null
	list: RefObject<FlatList<TimelineItem> | null>
	scrollToKey(key: string): void
	scrollToTime(at: number): void
	retryScroll(index: number): void
}

export function useSessionDetail(sessionId: string, soundId?: string): SessionDetail {
	const session = useQuery({
		...sessionQueryOptions(sessionId),
		refetchInterval: (query) => (query.state.data?.status === "running" ? REFRESH_MS : false),
	})
	const running = session.data?.status === "running"
	const timeline = useQuery({
		...timelineQueryOptions(sessionId),
		refetchInterval: running ? REFRESH_MS : false,
	})
	const [filter, setFilter] = useState<TimelineFilter>("all")
	const [highlightedKey, setHighlightedKey] = useState<string | null>(soundId ?? null)
	const [cursor, setCursor] = useState<number | null>(null)
	const list = useRef<FlatList<TimelineItem>>(null)
	const all = useMemo(() => (timeline.data ? buildTimeline(timeline.data) : []), [timeline.data])
	const items = useMemo(() => all.filter((item) => matches(item, filter)), [all, filter])
	const pendingKey = useRef<string | null>(soundId ?? null)
	const endedAt = session.data?.ended_at
	const end = endedAt ? Date.parse(endedAt) : session.dataUpdatedAt

	function scrollToIndex(index: number) {
		list.current?.scrollToIndex({ index, viewPosition: 0.3 })
	}

	function focus(index: number) {
		const item = items[index]

		if (!item) {
			return
		}

		setHighlightedKey(item.key)
		setCursor(item.at)
		scrollToIndex(index)
	}

	useEffect(() => {
		const key = pendingKey.current

		if (!key || !timeline.data) {
			return
		}

		const index = items.findIndex((item) => item.key === key)

		pendingKey.current = null

		if (index >= 0) {
			setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.3 }), 300)
		}
	}, [items, timeline.data])

	function scrollToKey(key: string) {
		const index = items.findIndex((item) => item.key === key)

		if (index >= 0) {
			focus(index)

			return
		}

		const item = all.find((entry) => entry.key === key)

		if (item) {
			pendingKey.current = key
			setHighlightedKey(key)
			setCursor(item.at)
			setFilter("all")
		}
	}

	return {
		session,
		timeline,
		running,
		end,
		items,
		filter,
		setFilter,
		highlightedKey,
		cursor,
		list,
		scrollToKey,
		scrollToTime: (at) => {
			if (items.length > 0) {
				focus(nearestIndex(items, at))
			}
		},
		retryScroll: (index) => {
			list.current?.scrollToOffset({ offset: index * 64, animated: false })
			setTimeout(() => scrollToIndex(index), 100)
		},
	}
}
