import type { Heartbeat, HeartbeatLearningSegment, Phase } from '@/types/apis/sessions';

import type { SleepSettings } from '@/types/sleep-settings';

import dayjs from 'dayjs';
import {
	type AudioBuffer,
	type AudioBufferSourceNode,
	AudioContext,
	AudioManager,
	AudioRecorder,
} from 'react-native-audio-api';

import { LEARNING_TICK_MS, VAD, WORD_REPLAY_DELAY_FACTOR } from '@/config';
import { SECOND } from '@/config/units';
import { loadStressCareTracks } from '@/screens/session/services/tracks';
import { createSoundDetector, type SoundSegment } from '@/screens/session/services/vad';
import { saveWav } from '@/screens/session/services/wav';
import { currentSpan, type PhaseSpan } from '@/utils/phases';

interface CapturedSound {
	uri: string;
	capturedAt: string;
}

interface LearningSegment {
	startedAt: number;
	endedAt: number;
	playCount: number;
	playDurationMs: number;
	closed: boolean;
	acknowledged: boolean;
}

interface LearningEngineOptions {
	wordId: string;
	recordingUrls: readonly string[];
	startedAt: number;
	sleep: SleepSettings | null;
	onSound: (sound: CapturedSound) => void;
	onError: (error: unknown) => void;
}

export interface LearningEngine {
	start: () => Promise<void>;
	pause: () => Promise<void>;
	resume: () => Promise<void>;
	stop: () => Promise<void>;
	unacknowledgedSegments: () => HeartbeatLearningSegment[];
	acknowledgeSegments: (
		acknowledgedSegments: Heartbeat['acknowledged'],
		sentSegments: HeartbeatLearningSegment[],
	) => void;
	learningMs: () => number;
	playCount: () => number;
}

/** 학습 엔진을 만드는 함수 */
export const createLearningEngine = (options: LearningEngineOptions) => {
	const detector = createSoundDetector(VAD);
	const recorder = new AudioRecorder();

	let context: AudioContext | null = null;
	let recordings: AudioBuffer[] = [];
	let careTracks: string[] = [];
	let timer: ReturnType<typeof setInterval> | null = null;
	let running = false;
	let stopped = false;
	let phase: Phase | null = null;
	let clip: AudioBufferSourceNode | null = null;
	let careSource: AudioBufferSourceNode | null = null;
	let chosenCareTrack: { spanStart: number; buffer: AudioBuffer; offset: number } | null = null;
	let careStartedAt = 0;
	let nextClipIndex = 0;
	let nextPlayAt = 0;
	let lastTick = 0;
	let learningSegments: LearningSegment[] = [];

	/** 새 학습 구간을 여는 함수 */
	const openLearningSegment = () => {
		learningSegments = [
			...learningSegments,
			{
				startedAt: lastTick,
				endedAt: lastTick,
				playCount: 0,
				playDurationMs: 0,
				closed: false,
				acknowledged: false,
			},
		];
	};

	/** 열린 학습 구간을 현재 시각까지 늘리는 함수 */
	const extendLearningSegment = (now: number) => {
		learningSegments = learningSegments.map((segment) => (segment.closed ? segment : { ...segment, endedAt: now }));
	};

	/** 열린 학습 구간에 재생 기록을 더하는 함수 */
	const addPlayToLearningSegment = (durationMs: number) => {
		learningSegments = learningSegments.map((segment) =>
			segment.closed
				? segment
				: {
						...segment,
						playCount: segment.playCount + 1,
						playDurationMs: segment.playDurationMs + Math.round(durationMs),
					},
		);
	};

	/** 열린 학습 구간을 닫는 함수 */
	const closeLearningSegment = () => {
		learningSegments = learningSegments.map((segment) => ({ ...segment, closed: true }));
	};

	/** 감지한 소리를 WAV 파일로 저장해 전달하는 함수 */
	const emitSound = (segment: SoundSegment | null) => {
		if (!segment) {
			return;
		}

		try {
			options.onSound({
				uri: saveWav(segment.samples, VAD.sampleRate),
				capturedAt: dayjs().subtract(segment.durationMs, 'ms').toISOString(),
			});
		} catch (e) {
			options.onError(e);
		}
	};

	/** 단어 녹음 재생 정지 함수 */
	const stopClip = () => {
		const playingSource = clip;

		clip = null;

		playingSource?.stop();
	};

	/** 스트레스 케어 음원을 정지하고 이어 재생할 위치를 저장하는 함수 */
	const stopCare = () => {
		const playingSource = careSource;

		careSource = null;

		if (playingSource && context && chosenCareTrack) {
			chosenCareTrack = {
				...chosenCareTrack,
				offset:
					(chosenCareTrack.offset + context.currentTime - careStartedAt) % chosenCareTrack.buffer.duration,
			};
		}

		playingSource?.stop();
	};

	/** 다음 단어 녹음 재생 함수 */
	const playClip = (now: number) => {
		const buffer = recordings[nextClipIndex % recordings.length];

		if (!context || !buffer) {
			return;
		}

		emitSound(detector.flush());

		const source = context.createBufferSource();
		const durationMs = buffer.duration * SECOND;

		source.buffer = buffer;
		source.connect(context.destination);
		source.onEnded = () => {
			if (clip === source) {
				clip = null;
				nextPlayAt = dayjs()
					.add(durationMs * WORD_REPLAY_DELAY_FACTOR, 'ms')
					.valueOf();
			}
		};
		source.start();

		clip = source;
		nextClipIndex += 1;
		nextPlayAt = Number.POSITIVE_INFINITY;

		detector.suspend(now + durationMs + VAD.ignoreAfterPlaybackMs);

		addPlayToLearningSegment(durationMs);
	};

	/** 스트레스 케어 음원 반복 재생 함수 */
	const playCare = async (span: PhaseSpan) => {
		const contextAtStart = context;

		if (!contextAtStart) {
			return;
		}

		if (chosenCareTrack?.spanStart !== span.start) {
			const track = careTracks[Math.floor(Math.random() * careTracks.length)];

			if (!track) {
				return;
			}

			chosenCareTrack = {
				spanStart: span.start,
				buffer: await contextAtStart.decodeAudioData(track),
				offset: 0,
			};
		}

		if (context !== contextAtStart || phase !== 'stress_care' || !running || careSource) {
			return;
		}

		const source = contextAtStart.createBufferSource();

		source.buffer = chosenCareTrack.buffer;
		source.loop = true;
		source.connect(contextAtStart.destination);
		source.start(0, chosenCareTrack.offset);

		careSource = source;
		careStartedAt = contextAtStart.currentTime;
	};

	/** 학습 단계가 바뀌었을 때 실행하는 함수 */
	const enterPhase = (span: PhaseSpan) => {
		emitSound(detector.flush());

		closeLearningSegment();
		stopClip();
		stopCare();

		phase = span.phase;
		nextPlayAt = 0;

		if (span.phase === 'learning') {
			openLearningSegment();
		}

		if (span.phase === 'stress_care') {
			detector.suspend(span.end + VAD.ignoreAfterPlaybackMs);

			playCare(span).catch(options.onError);
		}
	};

	/** 학습 타이머가 주기마다 실행하는 함수 */
	const tick = () => {
		const now = dayjs().valueOf();
		const span = currentSpan(options.startedAt, now, options.sleep);

		if (span.phase !== phase) {
			enterPhase(span);
		}

		if (phase === 'learning') {
			extendLearningSegment(now);

			if (!clip && now >= nextPlayAt) {
				playClip(now);
			}
		}

		lastTick = now;
	};

	/** 마이크 녹음 시작 함수 */
	const startRecorder = async () => {
		recorder.onAudioReady(
			{
				sampleRate: VAD.sampleRate,
				bufferLength: (VAD.sampleRate * VAD.frameMs) / SECOND,
				channelCount: 1,
			},
			({ buffer }) => {
				if (running) {
					detector.push(buffer.getChannelData(0), dayjs().valueOf()).forEach(emitSound);
				}
			},
		);
		recorder.onError((event) => options.onError(new Error(event.message)));

		const result = await recorder.start();

		if (result.status === 'error') {
			throw new Error(result.message);
		}
	};

	/** 학습 엔진 실행 함수 */
	const startRunning = async () => {
		if (stopped) {
			return;
		}

		running = true;
		phase = null;
		lastTick = dayjs().valueOf();

		await startRecorder();

		if (!recorder.isRecording()) {
			await recorder.stop();
			await startRecorder();
		}

		if (stopped || !running) {
			await recorder.stop();

			return;
		}

		tick();

		timer = setInterval(tick, LEARNING_TICK_MS);
	};

	/** 학습 엔진 정지 함수 */
	const stopRunning = async () => {
		running = false;

		closeLearningSegment();

		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		emitSound(detector.flush());

		stopClip();
		stopCare();

		if (recorder.isRecording()) {
			await recorder.stop();
		}
	};

	return {
		start: async () => {
			AudioManager.setAudioSessionOptions({
				iosCategory: 'playAndRecord',
				iosMode: 'default',
				iosOptions: ['defaultToSpeaker'],
			});
			await AudioManager.setAudioSessionActivity(true);

			if (stopped) {
				return;
			}

			const createdContext = new AudioContext();

			context = createdContext;
			recordings = await Promise.all(options.recordingUrls.map((url) => createdContext.decodeAudioData(url)));
			careTracks = await loadStressCareTracks();

			await startRunning();
		},
		pause: async () => {
			await stopRunning();
			await context?.suspend();
		},
		resume: async () => {
			await context?.resume();
			await startRunning();
		},
		stop: async () => {
			stopped = true;

			await stopRunning();

			recorder.clearOnAudioReady();
			recorder.clearOnError();

			await context?.close();
			context = null;

			await AudioManager.setAudioSessionActivity(false);
		},
		/** 확인받지 않은 학습 구간을 반환하는 함수 */
		unacknowledgedSegments: () =>
			learningSegments
				.filter((segment) => !segment.acknowledged)
				.map((segment) => ({
					word_id: options.wordId,
					started_at: dayjs(segment.startedAt).toISOString(),
					ended_at: dayjs(segment.endedAt).toISOString(),
					play_count: segment.playCount,
					play_duration_ms: segment.playDurationMs,
				})),
		/** 확인받은 학습 구간을 기록하는 함수 */
		acknowledgeSegments: (
			acknowledgedSegments: Heartbeat['acknowledged'],
			sentSegments: HeartbeatLearningSegment[],
		) => {
			learningSegments = learningSegments.map((segment) => {
				const finalValueSent =
					segment.closed &&
					sentSegments.some(
						(sentSegment) =>
							sentSegment.started_at === dayjs(segment.startedAt).toISOString() &&
							sentSegment.ended_at === dayjs(segment.endedAt).toISOString(),
					);
				const startedAtAcknowledged = acknowledgedSegments.some(
					(acknowledgedSegment) => dayjs(acknowledgedSegment.started_at).valueOf() === segment.startedAt,
				);

				return finalValueSent && startedAtAcknowledged ? { ...segment, acknowledged: true } : segment;
			});
		},
		learningMs: () => learningSegments.reduce((sum, segment) => sum + segment.endedAt - segment.startedAt, 0),
		/** 전체 재생 횟수를 반환하는 함수 */
		playCount: () => learningSegments.reduce((sum, segment) => sum + segment.playCount, 0),
	};
};
