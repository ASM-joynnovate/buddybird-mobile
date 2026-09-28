import { SECOND } from '@/utils/units';

type VadSettings = {
	sampleRate: number;
	frameMs: number;
	dbFloor: number;
	dbCeil: number;
	threshold: number;
	minSoundMs: number;
	minSilenceMs: number;
	padBeforeMs: number;
	maxSegmentMs: number;
};

export type SoundSegment = {
	samples: Float32Array;
	durationMs: number;
	soundStartMs: number;
	soundEndMs: number;
};

type SoundDetector = {
	push(samples: Float32Array, now: number): SoundSegment[];
	suspend(untilMs: number): void;
	flush(): SoundSegment | null;
};

const AMPLITUDE_DB_FACTOR = 20;
const MIN_RMS = 1e-9;
const EMPTY: Float32Array = new Float32Array(0);

function concat(first: Float32Array, second: Float32Array): Float32Array {
	const joined = new Float32Array(first.length + second.length);

	joined.set(first);
	joined.set(second, first.length);

	return joined;
}

function tail(samples: Float32Array, length: number): Float32Array {
	return samples.slice(Math.max(0, samples.length - length));
}

function isLoud(frame: Float32Array, settings: VadSettings): boolean {
	const power = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
	const decibels = AMPLITUDE_DB_FACTOR * Math.log10(Math.max(Math.sqrt(power), MIN_RMS));
	const level = (decibels - settings.dbFloor) / (settings.dbCeil - settings.dbFloor);

	return Math.min(1, Math.max(0, level)) > settings.threshold;
}

export function createSoundDetector(settings: VadSettings): SoundDetector {
	const samplesPerMs = settings.sampleRate / SECOND;
	const frameSamples = samplesPerMs * settings.frameMs;
	const padBeforeSampleCount = samplesPerMs * settings.padBeforeMs;

	let leftoverSamples = EMPTY;
	let padBeforeSamples = EMPTY;
	let loudCandidate = EMPTY;
	let segment = EMPTY;
	let soundStartMs = 0;
	let quietTailMs = 0;
	let suspendedUntil = 0;

	const msOf = (samples: Float32Array) => samples.length / samplesPerMs;

	function reset() {
		padBeforeSamples = EMPTY;
		loudCandidate = EMPTY;
		segment = EMPTY;
		soundStartMs = 0;
		quietTailMs = 0;
	}

	function flush(): SoundSegment | null {
		if (segment.length === 0) {
			reset();

			return null;
		}

		const durationMs = msOf(segment);
		const startMs = Math.min(soundStartMs, durationMs);
		const completedSegment = {
			samples: segment,
			durationMs,
			soundStartMs: startMs,
			soundEndMs: Math.max(startMs, durationMs - quietTailMs),
		};

		reset();

		return completedSegment;
	}

	function consume(frame: Float32Array): SoundSegment | null {
		const loud = isLoud(frame, settings);

		if (segment.length > 0) {
			segment = concat(segment, frame);
			quietTailMs = loud ? 0 : quietTailMs + settings.frameMs;
		} else if (loud) {
			loudCandidate = concat(loudCandidate, frame);

			if (msOf(loudCandidate) >= settings.minSoundMs) {
				segment = tail(concat(padBeforeSamples, loudCandidate), padBeforeSampleCount);
				soundStartMs = Math.max(0, msOf(segment) - settings.minSoundMs);
				padBeforeSamples = EMPTY;
				loudCandidate = EMPTY;
			}
		} else {
			padBeforeSamples = tail(concat(concat(padBeforeSamples, loudCandidate), frame), padBeforeSampleCount);
			loudCandidate = EMPTY;
		}

		const complete =
			segment.length > 0 && (msOf(segment) >= settings.maxSegmentMs || quietTailMs >= settings.minSilenceMs);

		return complete ? flush() : null;
	}

	return {
		push(samples, now) {
			if (now < suspendedUntil) {
				leftoverSamples = EMPTY;
				reset();

				return [];
			}

			const completedSegments: SoundSegment[] = [];

			leftoverSamples = concat(leftoverSamples, samples);

			while (leftoverSamples.length >= frameSamples) {
				const completedSegment = consume(leftoverSamples.slice(0, frameSamples));

				leftoverSamples = leftoverSamples.slice(frameSamples);

				if (completedSegment) {
					completedSegments.push(completedSegment);
				}
			}

			return completedSegments;
		},
		suspend(untilMs) {
			suspendedUntil = Math.max(suspendedUntil, untilMs);
			leftoverSamples = EMPTY;
			reset();
		},
		flush,
	};
}
