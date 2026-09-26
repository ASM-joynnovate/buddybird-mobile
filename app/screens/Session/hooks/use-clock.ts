import type { TFunction } from "i18next"
import { useEffect, useState } from "react"

import { STATION_DISCONNECT_MS } from "@/config"
import { formatClock, formatTimer } from "@/i18n/format"
import { currentSpan, type Phase } from "@/services/session/phases"
import type { SleepSettings } from "@/types/apis/settings"
import type { Locale } from "@/types/locale"
import { SECOND } from "@/utils/units"

export function useNow(enabled = true, intervalMs = SECOND): number {
	const [now, setNow] = useState(Date.now)

	useEffect(() => {
		if (!enabled) {
			return
		}

		setNow(Date.now())

		const timer = setInterval(() => setNow(Date.now()), intervalMs)

		return () => clearInterval(timer)
	}, [enabled, intervalMs])

	return now
}

export type PhaseStatus = { phase: Phase; remainingMs: number; fraction: number }

export function phaseStatus(startedAt: string, sleep: SleepSettings, now: number): PhaseStatus {
	const span = currentSpan(Date.parse(startedAt), now, {
		sleepAt: sleep.sleep_at,
		wakeAt: sleep.wake_at,
	})
	const total = span.end - span.start

	return {
		phase: span.phase,
		remainingMs: span.end - now,
		fraction: total > 0 ? (span.end - now) / total : 0,
	}
}

export function isDisconnected(lastHeartbeatAt: string | null, now: number): boolean {
	return lastHeartbeatAt === null || now - Date.parse(lastHeartbeatAt) > STATION_DISCONNECT_MS
}

export function remainingText(
	status: PhaseStatus,
	wakeAt: string,
	t: TFunction,
	locale: Locale,
): string {
	const left = formatTimer(status.remainingMs)

	return status.phase === "sleeping"
		? t("session.untilWake", { time: formatClock(wakeAt, locale), left })
		: t("session.remaining", { left })
}
