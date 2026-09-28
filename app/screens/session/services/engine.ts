import type { HeartbeatSummary, Phase } from '@/types/apis/sessions';

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
import { loadStressCareTracks } from '@/screens/session/services/tracks';
import { createSoundDetector, type SoundSegment } from '@/screens/session/services/vad';
import { saveWav } from '@/screens/session/services/wav';
import { localDate } from '@/utils/date';
import { currentSpan, type PhaseSpan } from '@/utils/phases';
import { SECOND } from '@/utils/units';

interface CapturedSound {
	uri: string;
	capturedAt: string;
}

interface LearningEngineOptions {
	wordId: string;
	recordingUrls: readonly string[];
	startedAt: number;
	sleep: SleepSettings;
	onSound: (sound: CapturedSound) => void;
	onError: (error: unknown) => void;
}

export interface LearningEngine {
	start: () => Promise<void>;
	pause: () => Promise<void>;
	resume: () => Promise<void>;
	stop: () => Promise<void>;
	summaries: () => HeartbeatSummary[];
	learningMs: () => number;
}

type SummaryField = 'play_count' | 'play_duration_ms' | 'learning_duration_ms';

/** 단계에 맞춰 단어 녹음과 스트레스 케어 음원을 재생하고 들린 소리를 녹음하는 학습 엔진 생성 */
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
	let summariesByDate: Record<string, HeartbeatSummary> = {};

	/** 시각이 속한 날짜의 하트비트 요약에서 field 값 늘리기 */
	const addToSummary = (field: SummaryField, amount: number, at: number) => {
		const date = localDate(at);
		const summary = summariesByDate[date] ?? {
			word_id: options.wordId,
			local_date: date,
			play_count: 0,
			play_duration_ms: 0,
			learning_duration_ms: 0,
		};

		summariesByDate = {
			...summariesByDate,
			[date]: { ...summary, [field]: (summary[field] ?? 0) + Math.round(amount) },
		};
	};

	/** 소리 구간을 WAV 파일로 저장해 onSound로 전달, 실패하면 onError로 전달 */
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

	/** 재생 중인 단어 녹음 정지 */
	const stopClip = () => {
		const playingSource = clip;

		clip = null;

		playingSource?.stop();
	};

	/** 스트레스 케어 음원 정지와 다음에 이어 재생할 위치 저장 */
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

	/** 다음 단어 녹음 재생과 재생 횟수, 재생 시간 기록 */
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

		addToSummary('play_count', 1, now);
		addToSummary('play_duration_ms', durationMs, now);
	};

	/** 스트레스 케어 구간의 음원을 골라 멈춘 위치부터 반복 재생 */
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

	/** 단계가 바뀔 때 모으던 소리 전달, 재생 정지, 스트레스 케어 단계면 음원 재생 */
	const enterPhase = (span: PhaseSpan) => {
		emitSound(detector.flush());

		stopClip();
		stopCare();

		phase = span.phase;
		nextPlayAt = 0;

		if (span.phase === 'stress_care') {
			detector.suspend(span.end + VAD.ignoreAfterPlaybackMs);

			playCare(span).catch(options.onError);
		}
	};

	/** 주기마다 단계 확인, 학습 시간 기록, 다음 단어 녹음 재생 */
	const tick = () => {
		const now = dayjs().valueOf();
		const span = currentSpan(options.startedAt, now, options.sleep);

		if (span.phase !== phase) {
			enterPhase(span);
		}

		if (phase === 'learning') {
			addToSummary('learning_duration_ms', now - lastTick, now);

			if (!clip && now >= nextPlayAt) {
				playClip(now);
			}
		}

		lastTick = now;
	};

	/** 마이크 녹음 시작과 들어온 샘플의 소리 구간 전달 */
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

	/** 녹음 시작과 단계 확인 타이머 시작 */
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

	/** 단계 확인 타이머 정지, 모으던 소리 전달, 재생과 녹음 정지 */
	const stopRunning = async () => {
		running = false;

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
		summaries: () => Object.values(summariesByDate),
		learningMs: () =>
			Object.values(summariesByDate).reduce((sum, summary) => sum + (summary.learning_duration_ms ?? 0), 0),
	};
};
