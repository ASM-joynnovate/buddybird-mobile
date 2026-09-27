type VadSettings = {
	sampleRate: number
	frameMs: number
	dbFloor: number
	dbCeil: number
	threshold: number
	sustainMs: number
	releaseMs: number
	preRollMs: number
	maxSegmentMs: number
}

export type SpeechSegment = {
	samples: Float32Array
	durationMs: number
	speechStartMs: number
	speechEndMs: number
}

type SpeechDetector = {
	push(samples: Float32Array, now: number): SpeechSegment[]
	suspend(untilMs: number): void
	flush(): SpeechSegment | null
}

const DB_PER_DECADE = 20
const SILENCE_RMS = 1e-9
const EMPTY: Float32Array = new Float32Array(0)

function concat(first: Float32Array, second: Float32Array): Float32Array {
	const joined = new Float32Array(first.length + second.length)

	joined.set(first)
	joined.set(second, first.length)

	return joined
}

function tail(samples: Float32Array, length: number): Float32Array {
	return samples.slice(Math.max(0, samples.length - length))
}

function isLoud(frame: Float32Array, settings: VadSettings): boolean {
	const power = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length
	const decibels = DB_PER_DECADE * Math.log10(Math.max(Math.sqrt(power), SILENCE_RMS))
	const level = (decibels - settings.dbFloor) / (settings.dbCeil - settings.dbFloor)

	return Math.min(1, Math.max(0, level)) > settings.threshold
}

export function createSpeechDetector(settings: VadSettings): SpeechDetector {
	const samplesPerMs = settings.sampleRate / 1000
	const frameSamples = samplesPerMs * settings.frameMs
	const preRollSamples = samplesPerMs * settings.preRollMs

	let pending = EMPTY
	let preRoll = EMPTY
	let onset = EMPTY
	let segment = EMPTY
	let speechStartMs = 0
	let quietTailMs = 0
	let suspendedUntil = 0

	const msOf = (samples: Float32Array) => samples.length / samplesPerMs

	function reset() {
		preRoll = EMPTY
		onset = EMPTY
		segment = EMPTY
		speechStartMs = 0
		quietTailMs = 0
	}

	function flush(): SpeechSegment | null {
		if (segment.length === 0) {
			reset()

			return null
		}

		const durationMs = msOf(segment)
		const startMs = Math.min(speechStartMs, durationMs)
		const found = {
			samples: segment,
			durationMs,
			speechStartMs: startMs,
			speechEndMs: Math.max(startMs, durationMs - quietTailMs),
		}

		reset()

		return found
	}

	function consume(frame: Float32Array): SpeechSegment | null {
		const loud = isLoud(frame, settings)

		if (segment.length > 0) {
			segment = concat(segment, frame)
			quietTailMs = loud ? 0 : quietTailMs + settings.frameMs
		} else if (loud) {
			onset = concat(onset, frame)

			if (msOf(onset) >= settings.sustainMs) {
				segment = tail(concat(preRoll, onset), preRollSamples)
				speechStartMs = Math.max(0, msOf(segment) - settings.sustainMs)
				preRoll = EMPTY
				onset = EMPTY
			}
		} else {
			preRoll = tail(concat(concat(preRoll, onset), frame), preRollSamples)
			onset = EMPTY
		}

		const complete =
			segment.length > 0 &&
			(msOf(segment) >= settings.maxSegmentMs || quietTailMs >= settings.releaseMs)

		return complete ? flush() : null
	}

	return {
		push(samples, now) {
			if (now < suspendedUntil) {
				pending = EMPTY
				reset()

				return []
			}

			const found: SpeechSegment[] = []

			pending = concat(pending, samples)

			while (pending.length >= frameSamples) {
				const segmentFound = consume(pending.slice(0, frameSamples))

				pending = pending.slice(frameSamples)

				if (segmentFound) {
					found.push(segmentFound)
				}
			}

			return found
		},
		suspend(untilMs) {
			suspendedUntil = Math.max(suspendedUntil, untilMs)
			pending = EMPTY
			reset()
		},
		flush,
	}
}
