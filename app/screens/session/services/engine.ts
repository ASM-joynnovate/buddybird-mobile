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

import { LEARNING_TICK_MS, VAD, WORD_REST_FACTOR } from '@/config';
import { stressCareTracks } from '@/screens/session/services/tracks';
import { createSpeechDetector, type SpeechSegment } from '@/screens/session/services/vad';
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

type Counter = 'play_count' | 'play_duration_ms' | 'learning_duration_ms';

export function createLearningEngine(options: LearningEngineOptions): LearningEngine {
	const detector = createSpeechDetector(VAD);
	const recorder = new AudioRecorder();

	let context: AudioContext | null = null;
	let recordings: AudioBuffer[] = [];
	let careTracks: string[] = [];
	let timer: ReturnType<typeof setInterval> | null = null;
	let running = false;
	let stopped = false;
	let phase: Phase | null = null;
	let clip: AudioBufferSourceNode | null = null;
	let care: AudioBufferSourceNode | null = null;
	let chosenCare: { spanStart: number; buffer: AudioBuffer; offset: number } | null = null;
	let careStartedAt = 0;
	let nextClip = 0;
	let nextPlayAt = 0;
	let lastTick = 0;
	let totals: Record<string, HeartbeatSummary> = {};

	function count(counter: Counter, amount: number, at: number) {
		const date = localDate(at);
		const current = totals[date] ?? {
			word_id: options.wordId,
			local_date: date,
			play_count: 0,
			play_duration_ms: 0,
			learning_duration_ms: 0,
		};

		totals = {
			...totals,
			[date]: { ...current, [counter]: (current[counter] ?? 0) + Math.round(amount) },
		};
	}

	function emit(segment: SpeechSegment | null) {
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
		const playing = clip;

		clip = null;

		playing?.stop();
	}

	function stopCare() {
		const playing = care;

		care = null;

		if (playing && context && chosenCare) {
			chosenCare = {
				...chosenCare,
				offset: (chosenCare.offset + context.currentTime - careStartedAt) % chosenCare.buffer.duration,
			};
		}

		playing?.stop();
	}

	function playClip(now: number) {
		const buffer = recordings[nextClip % recordings.length];

		if (!context || !buffer) {
			return;
		}

		emit(detector.flush());

		const source = context.createBufferSource();
		const durationMs = buffer.duration * SECOND;

		source.buffer = buffer;
		source.connect(context.destination);
		source.onEnded = () => {
			if (clip === source) {
				clip = null;
				nextPlayAt = dayjs()
					.add(durationMs * WORD_REST_FACTOR, 'ms')
					.valueOf();
			}
		};
		source.start();

		clip = source;
		nextClip += 1;
		nextPlayAt = Number.POSITIVE_INFINITY;

		detector.suspend(now + durationMs + VAD.echoTailGuardMs);

		count('play_count', 1, now);
		count('play_duration_ms', durationMs, now);
	}

	async function playCare(span: PhaseSpan) {
		const owner = context;

		if (!owner) {
			return;
		}

		if (chosenCare?.spanStart !== span.start) {
			const track = careTracks[Math.floor(Math.random() * careTracks.length)];

			if (!track) {
				return;
			}

			chosenCare = {
				spanStart: span.start,
				buffer: await owner.decodeAudioData(track),
				offset: 0,
			};
		}

		if (context !== owner || phase !== 'stress_care' || !running || care) {
			return;
		}

		const source = owner.createBufferSource();

		source.buffer = chosenCare.buffer;
		source.loop = true;
		source.connect(owner.destination);
		source.start(0, chosenCare.offset);

		care = source;
		careStartedAt = owner.currentTime;
	}

	function enter(span: PhaseSpan) {
		emit(detector.flush());

		stopClip();
		stopCare();

		phase = span.phase;
		nextPlayAt = 0;

		if (span.phase === 'stress_care') {
			detector.suspend(span.end + VAD.echoTailGuardMs);

			playCare(span).catch(options.onError);
		}
	}

	function tick() {
		const now = dayjs().valueOf();
		const span = currentSpan(options.startedAt, now, options.sleep);

		if (span.phase !== phase) {
			enter(span);
		}

		if (phase === 'learning') {
			count('learning_duration_ms', now - lastTick, now);

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
					detector.push(buffer.getChannelData(0), dayjs().valueOf()).forEach(emit);
				}
			},
		);
		recorder.onError((event) => options.onError(new Error(event.message)));

		const result = await recorder.start();

		if (result.status === 'error') {
			throw new Error(result.message);
		}
	}

	async function begin() {
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

	async function halt() {
		running = false;

		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		emit(detector.flush());

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

			const created = new AudioContext();

			context = created;
			recordings = await Promise.all(options.recordingUrls.map((url) => created.decodeAudioData(url)));
			careTracks = await stressCareTracks();

			await begin();
		},
		async pause() {
			await halt();
			await context?.suspend();
		},
		async resume() {
			await context?.resume();
			await begin();
		},
		async stop() {
			stopped = true;

			await halt();

			recorder.clearOnAudioReady();
			recorder.clearOnError();

			await context?.close();
			context = null;

			await AudioManager.setAudioSessionActivity(false);
		},
		summaries: () => Object.values(totals),
		learningMs: () => Object.values(totals).reduce((sum, row) => sum + (row.learning_duration_ms ?? 0), 0),
	};
}
