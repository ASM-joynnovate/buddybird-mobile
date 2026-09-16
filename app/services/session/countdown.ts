import type  { SessionSettings } from "@/types/session"
import type  { SessionSnapshot } from "@modules/session-audio-engine"

export function sessionCountdown(snapshot: SessionSnapshot, settings?: SessionSettings) {
	const total = (settings?.totalDurationSeconds ?? 1) * 1000
	const durations = {
		"learning": settings?.learningDurationSeconds ?? 1,
		"rest": settings?.restDurationSeconds ?? 0,
		"stress-care": settings?.stressCareDurationSeconds ?? 0,
	}
	const phaseDuration = durations[snapshot.phase] * 1000
	const remaining = Math.max(
		0,
		Math.min(phaseDuration - snapshot.phaseElapsedMs, total - snapshot.elapsedRunningMs),
	)
	const seconds = Math.ceil(remaining / 1000)
	const timerMinutes = String(Math.floor(seconds / 60)).padStart(2, "0")
	const timerSeconds = String(seconds % 60).padStart(2, "0")
	const timer = `${timerMinutes}:${timerSeconds}`
	const cycleDuration = Object.values(durations).reduce((sum, value) => sum + value, 0)
	const cycleCount = Math.max(1, Math.ceil(total / 1000 / (cycleDuration || 1)))
	const progress = phaseDuration > 0 ? Math.min(1, snapshot.phaseElapsedMs / phaseDuration) : 0
	const elapsedPercent = Math.min(100, (snapshot.elapsedRunningMs / total) * 100)

	return { timer, cycleCount, progress, elapsedPercent, phaseDuration, remaining }
}
