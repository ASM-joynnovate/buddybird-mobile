import { SECOND } from '@/utils/units';

interface VadSettings {
	sampleRate: number;
	frameMs: number;
	dbFloor: number;
	dbCeil: number;
	threshold: number;
	minSoundMs: number;
	minSilenceMs: number;
	padBeforeMs: number;
	maxSegmentMs: number;
}

export interface SoundSegment {
	samples: Float32Array;
	durationMs: number;
	soundStartMs: number;
	soundEndMs: number;
}

const AMPLITUDE_DB_FACTOR = 20;
const MIN_RMS = 1e-9;
const EMPTY: Float32Array = new Float32Array(0);

/** 두 샘플 배열을 이어 붙인 새 배열 */
const concat = (first: Float32Array, second: Float32Array) => {
	const joined = new Float32Array(first.length + second.length);

	joined.set(first);
	joined.set(second, first.length);

	return joined;
};

/** 샘플 배열의 끝에서 length개만 남긴 배열 */
const tail = (samples: Float32Array, length: number) => {
	return samples.slice(Math.max(0, samples.length - length));
};

/** 프레임의 소리 크기가 기준보다 큰지 여부 */
const isLoud = (frame: Float32Array, settings: VadSettings) => {
	const power = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
	const decibels = AMPLITUDE_DB_FACTOR * Math.log10(Math.max(Math.sqrt(power), MIN_RMS));
	const level = (decibels - settings.dbFloor) / (settings.dbCeil - settings.dbFloor);

	return Math.min(1, Math.max(0, level)) > settings.threshold;
};

/** 마이크 샘플에서 큰 소리가 난 구간을 찾는 push, suspend, flush 함수 생성 */
export const createSoundDetector = (settings: VadSettings) => {
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

	/** 샘플 개수를 밀리초 길이로 변환 */
	const msOf = (samples: Float32Array) => samples.length / samplesPerMs;

	/** 앞에 붙일 샘플, 큰 소리 후보, 모으던 구간 초기화 */
	const reset = () => {
		padBeforeSamples = EMPTY;
		loudCandidate = EMPTY;
		segment = EMPTY;
		soundStartMs = 0;
		quietTailMs = 0;
	};

	/** 모으던 소리 구간을 끝내고 반환, 없으면 null */
	const flush = () => {
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
	};

	/** 프레임 하나를 반영하고 소리 구간이 끝나면 그 구간 반환 */
	const consume = (frame: Float32Array) => {
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
	};

	return {
		push: (samples: Float32Array, now: number) => {
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
		suspend: (untilMs: number) => {
			suspendedUntil = Math.max(suspendedUntil, untilMs);
			leftoverSamples = EMPTY;
			reset();
		},
		flush,
	};
};
