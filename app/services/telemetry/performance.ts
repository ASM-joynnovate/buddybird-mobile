import { track } from "@/services/telemetry/client"

export function createPerformanceReporter(
	sessionId: string,
	state: () => { consentStatus: "unknown" | "granted" | "denied" },
) {
	const samples = {
		audio_delay: { count: 0, time: -Infinity },
		ui_lag: { count: 0, time: -Infinity },
	}
	const report = (kind: "audio_delay" | "ui_lag", milliseconds: number) => {
		const sample = samples[kind]
		const now = Date.now()

		if (milliseconds <= 200 || sample.count >= 20 || now - sample.time < 5000) {
			return
		}

		sample.count++
		sample.time = now
		const current = state()

		track("session_perf_degraded", {
			kind,
			value_ms: milliseconds,
			session_id: sessionId,
			consent_status: current.consentStatus,
		})
	}

	let timer: ReturnType<typeof setInterval> | undefined
	let lastPlayback = 0

	function setRunning(running: boolean) {
		if (!running) {
			clearInterval(timer)
			timer = undefined

			return
		}

		if (timer !== undefined) {
			return
		}

		let last = Date.now()

		timer = setInterval(() => {
			const now = Date.now()

			report("ui_lag", now - last - 100)
			last = now
		}, 100)
	}

	return {
		setRunning,
		audioDelay: (milliseconds: number, sequence: number) => {
			if (sequence <= lastPlayback) {
				return
			}

			lastPlayback = sequence
			report("audio_delay", milliseconds)
		},
		stop: () => setRunning(false),
	}
}
