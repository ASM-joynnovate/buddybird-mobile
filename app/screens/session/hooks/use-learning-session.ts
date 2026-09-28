import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { RootStackParamList } from '@/types/navigation';

import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	uploadSoundMutationOptions,
} from '@/hooks/apis/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';
import { wordQueryOptions } from '@/hooks/apis/words';

import { useHeartbeat } from '@/screens/session/hooks/use-heartbeat';
import { createLearningEngine, type LearningEngine } from '@/screens/session/services/engine';
import { reportError, track } from '@/services/telemetry/client';

type EndReason = 'time_reached' | 'user' | 'server';

type LearningSession = {
	startedAt: string | null;
	engineFailed: boolean;
	ending: boolean;
	end(): void;
};

export function useLearningSession(
	{ sessionId, wordId, endsAt, sleep, duration, sleepChanged }: RootStackParamList['SessionRun'],
	onFinished: () => void,
): LearningSession {
	const queryClient = useQueryClient();

	const running = useQuery(runningSessionQueryOptions());

	const { mutateAsync: upload } = useIdempotentMutation(uploadSoundMutationOptions());
	const { mutateAsync: finish } = useIdempotentMutation(finishSessionMutationOptions());

	const engine = useRef<LearningEngine | null>(null);
	const uploads = useRef<Promise<unknown>[]>([]);
	const soundCount = useRef(0);
	const pausedAt = useRef<number | null>(null);
	const closing = useRef(false);
	const onFinishedRef = useRef(onFinished);

	const [engineFailed, setEngineFailed] = useState(false);
	const [ending, setEnding] = useState(false);

	const runningSession = running.data?.id === sessionId ? running.data : null;
	const startedAt = runningSession?.period.started_at ?? null;

	useEffect(() => {
		onFinishedRef.current = onFinished;
	}, [onFinished]);

	const close = useCallback(
		async (reason: EndReason) => {
			if (closing.current) {
				return;
			}

			closing.current = true;

			setEnding(true);

			const learningMs = engine.current?.learningMs() ?? 0;
			const playCount = engine.current?.summaries().reduce((sum, row) => sum + row.play_count, 0) ?? 0;

			try {
				await engine.current?.stop();
				engine.current = null;

				await Promise.allSettled(uploads.current);

				if (reason !== 'server') {
					await finish({ id: sessionId });
				}
			} catch (error) {
				if (!(error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING')) {
					reportError(error, 'learning_end');
				}
			}

			track('learning_finished', {
				session_id: sessionId,
				reason,
				learning_duration_ms: learningMs,
				total_duration_ms: startedAt ? Date.now() - Date.parse(startedAt) : 0,
				play_count: playCount,
				sound_count: soundCount.current,
			});

			onFinishedRef.current();
		},
		[finish, sessionId, startedAt],
	);

	useHeartbeat({
		sessionId,
		startedAt,
		sleep,
		summaries: () => engine.current?.summaries() ?? [],
		onEnded: () => void close('server'),
	});

	useEffect(() => {
		if (!startedAt) {
			return;
		}

		let queue = queryClient
			.query({ ...wordQueryOptions(wordId), staleTime: 0 })
			.then(async (word) => {
				const created = createLearningEngine({
					wordId,
					recordingUrls: word.recordings.map((item) => item.url),
					startedAt: Date.parse(startedAt),
					sleep,
					onSound: (sound) => {
						soundCount.current += 1;

						const pending: Promise<unknown> = upload({
							sessionId,
							uri: sound.uri,
							capturedAt: sound.capturedAt,
						})
							.catch((error: unknown) => reportError(error, 'session_sound_upload'))
							.finally(() => {
								uploads.current = uploads.current.filter((item) => item !== pending);
							});

						uploads.current = [...uploads.current, pending];
					},
					onError: (error) => reportError(error, 'learning_engine'),
				});

				engine.current = created;

				await created.start();

				track('learning_started', {
					session_id: sessionId,
					word_id: wordId,
					recording_count: word.recordings.length,
					...(duration.ms === null ? {} : { planned_duration_ms: duration.ms }),
					custom_duration: duration.custom,
					sleep_changed: sleepChanged,
				});
			})
			.catch((error: unknown) => {
				reportError(error, 'learning_start');

				track('learning_finished', {
					session_id: sessionId,
					reason: 'error',
					learning_duration_ms: 0,
					total_duration_ms: Date.now() - Date.parse(startedAt),
					play_count: 0,
					sound_count: 0,
				});

				setEngineFailed(true);
			});

		const run = (step: () => Promise<void> | undefined) => {
			queue = queue.then(step).catch((error: unknown) => reportError(error, 'learning_engine'));
		};

		const lifecycle = AppState.addEventListener('change', (state) => {
			if (state !== 'active' && engine.current && pausedAt.current === null) {
				pausedAt.current = Date.now();

				track('learning_paused', { session_id: sessionId });
			} else if (state === 'active' && pausedAt.current !== null) {
				track('learning_resumed', {
					session_id: sessionId,
					paused_ms: Date.now() - pausedAt.current,
				});

				pausedAt.current = null;
			}

			run(() => (state === 'active' ? engine.current?.resume() : engine.current?.pause()));
		});

		return () => {
			lifecycle.remove();

			run(() => {
				const current = engine.current;

				engine.current = null;

				return current?.stop();
			});
		};
	}, [duration, queryClient, sessionId, sleep, sleepChanged, startedAt, upload, wordId]);

	useEffect(() => {
		if (endsAt === null) {
			return;
		}

		const timer = setTimeout(() => void close('time_reached'), Math.max(0, endsAt - Date.now()));

		return () => clearTimeout(timer);
	}, [close, endsAt]);

	return {
		startedAt,
		engineFailed,
		ending,
		end: () => void close('user'),
	};
}
