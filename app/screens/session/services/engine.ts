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

type CapturedSound = { uri: string; capturedAt: string };

type LearningEngineOptions = {
	wordId: string;
	recordingUrls: readonly string[];
	startedAt: number;
	sleep: SleepSettings;
	onSound(sound: CapturedSound): void;
	onError(error: unknown): void;
};

export type LearningEngine = {
	start(): Promise<void>;
	pause(): Promise<void>;
	resume(): Promise<void>;
	stop(): Promise<void>;
	summaries(): HeartbeatSummary[];
	learningMs(): number;
};

type SummaryField = 'play_count' | 'play_duration_ms' | 'learning_duration_ms';

export function createLearningEngine(options: LearningEngineOptions): LearningEngine {
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

	function addToSummary(field: SummaryField, amount: number, at: number) {
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
	}

	function emitSound(segment: SoundSegment | null) {
		if (!segment) {
			return;
		}

		try {
			options.onSound({
				uri: saveWav(segment.samples, VAD.sampleRate),
				capturedAt: dayjs().subtract(segment.durationMs, 'ms').toISOString(),
			});
		} catch (error) {
			options.onError(error);
		}
	}

	function stopClip() {
		const playingSource = clip;

		clip = null;

		playingSource?.stop();
	}

	function stopCare() {
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
	}

	function playClip(now: number) {
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
	}

	async function playCare(span: PhaseSpan) {
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
	}

	function enterPhase(span: PhaseSpan) {
		emitSound(detector.flush());

		stopClip();
		stopCare();

		phase = span.phase;
		nextPlayAt = 0;

		if (span.phase === 'stress_care') {
			detector.suspend(span.end + VAD.ignoreAfterPlaybackMs);

			playCare(span).catch(options.onError);
		}
	}

	function tick() {
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
	}

	async function startRecorder() {
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
	}

	async function startRunning() {
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
	}

	async function stopRunning() {
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
	}

	return {
		async start() {
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
		async pause() {
			await stopRunning();
			await context?.suspend();
		},
		async resume() {
			await context?.resume();
			await startRunning();
		},
		async stop() {
			stopped = true;

			await stopRunning();

			recorder.clearOnAudioReady();
			recorder.clearOnError();

			await context?.close();
			context = null;

			await AudioManager.setAudioSessionActivity(false);
		},
		summaries: () => Object.values(summariesByDate),
		learningMs: () => Object.values(summariesByDate).reduce((sum, row) => sum + (row.learning_duration_ms ?? 0), 0),
	};
}
