import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import type { FlatList } from "react-native"

import { useSessionRecord } from "@/hooks/use-session-record"
import type { SessionRecord, SessionTimeline, TimelineEvent, TimelineSound } from "@/mocks/types"

export type TimelineFilter = "all" | "sounds" | "connection"

export type TimelineItem =
	| { key: string; kind: "event"; at: number; event: TimelineEvent }
	| { key: string; kind: "sound"; at: number; sound: TimelineSound }

export const timelineFilters: readonly TimelineFilter[] = ["all", "sounds", "connection"]

const connectionKinds = new Set(["station_disconnected", "station_reconnected"])

function buildTimeline(timeline: SessionTimeline): TimelineItem[] {
	return [
		...timeline.events.map((event): TimelineItem => ({
			key: event.id,
			kind: "event",
			at: Date.parse(event.occurred_at),
			event,
		})),
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
	record: SessionRecord | undefined
	timeline: SessionTimeline | undefined
	isError: boolean
	retry(): void
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
	const { record, timeline, loadedAt, isError, retry } = useSessionRecord(sessionId)
	const running = record?.session.status === "running"
	const endedAt = record?.session.period.ended_at
	const end = endedAt ? Date.parse(endedAt) : loadedAt

	const [filter, setFilter] = useState<TimelineFilter>("all")
	const [highlightedKey, setHighlightedKey] = useState<string | null>(soundId ?? null)
	const [cursor, setCursor] = useState<number | null>(null)
	const list = useRef<FlatList<TimelineItem>>(null)
	const pendingKey = useRef<string | null>(soundId ?? null)

	const all = useMemo(() => (timeline ? buildTimeline(timeline) : []), [timeline])
	const items = useMemo(() => all.filter((item) => matches(item, filter)), [all, filter])

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

		if (!key || !timeline) {
			return
		}

		const index = items.findIndex((item) => item.key === key)

		pendingKey.current = null

		if (index >= 0) {
			setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.3 }), 300)
		}
	}, [items, timeline])

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
		record,
		timeline,
		isError,
		retry,
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
