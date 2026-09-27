import type { TFunction } from "i18next"
import { useEffect, useState } from "react"

import { formatTimer } from "@/i18n/format"
import { currentSpan, type Phase } from "@/services/session/phases"
import type { SleepSettings } from "@/types/apis/settings"
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

export type RunStatus = { phase: Phase; remainingMs: number | null; fraction: number | null }

export function runStatus(
	startedAt: string,
	endsAt: number | null,
	sleep: SleepSettings,
	now: number,
): RunStatus {
	const started = Date.parse(startedAt)
	const span = currentSpan(started, now, { sleepAt: sleep.sleep_at, wakeAt: sleep.wake_at })

	if (endsAt === null) {
		return { phase: span.phase, remainingMs: null, fraction: null }
	}

	return {
		phase: span.phase,
		remainingMs: endsAt - now,
		fraction: (now - started) / (endsAt - started),
	}
}

export function remainingText(status: RunStatus, t: TFunction): string | null {
	return status.remainingMs === null
		? null
		: t("session.remaining", { left: formatTimer(status.remainingMs) })
}
