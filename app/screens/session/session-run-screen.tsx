import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState, BackHandler, StyleSheet, View } from 'react-native';

import { ApiError } from '@/types/apis/common';
import type { HeartbeatLearningSegment } from '@/types/apis/sessions';

import type { RootStackParamList } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import { useFinishSession, useGetRunningSession, useSendHeartbeat, useUploadSessionSound } from '@/hooks/apis/sessions';
import { getWordOptions } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { queryClient } from '@/lib/query-client';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { HEARTBEAT_INTERVAL_MS } from '@/config';
import { SECOND } from '@/config/units';
import RunInfo from '@/screens/session/components/run-info';
import { createLearningEngine, type LearningEngine } from '@/screens/session/services/engine';
import { reportError, track } from '@/services/telemetry/client';
import { useSessionStore } from '@/stores/session';
import { sessionColors } from '@/theme/session-colors';
import { currentSpan } from '@/utils/phases';
import { uploadedRecordings } from '@/utils/uploaded-recordings';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

type EndReason = 'time_reached' | 'user' | 'server';

const FADE_MS = 2 * SECOND;

/** 하트비트 요청 본문 생성 함수 */
const createHeartbeatData = (
	startedAt: string | null,
	sleep: SleepSettings | null,
	learningSegments: HeartbeatLearningSegment[],
) => {
	const span = startedAt ? currentSpan(dayjs(startedAt).valueOf(), dayjs().valueOf(), sleep) : null;

	return {
		current_phase: span?.phase ?? null,
		phase_started_at: span ? dayjs(span.start).toISOString() : null,
		learning_segments: learningSegments,
	};
};

/** 학습 진행 화면 */
const SessionRunScreen = () => {
	useKeepAwake();

	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionRun'>>();

	const opacity = useSharedValue(1);

	const [endDialogOpen, setEndDialogOpen] = useState(false);

	const engineRef = useRef<LearningEngine | null>(null);
	const uploadsRef = useRef<Promise<unknown>[]>([]);
	const soundCountRef = useRef(0);
	const pausedAtRef = useRef<number | null>(null);
	const endingRef = useRef(false);

	const { data: runningSessionData } = useGetRunningSession();

	const { mutate: finishSession } = useFinishSession();
	const { mutateAsync: uploadSessionSound } = useUploadSessionSound();
	const { mutateAsync: sendHeartbeatAsync } = useSendHeartbeat();

	const infoVisible = useSessionStore((state) => state.infoVisible);
	const engineFailed = useSessionStore((state) => state.engineFailed);
	const sessionFinishing = useSessionStore((state) => state.sessionFinishing);
	const showInfo = useSessionStore((state) => state.showInfo);
	const setEngineFailed = useSessionStore((state) => state.setEngineFailed);
	const setSessionFinishing = useSessionStore((state) => state.setSessionFinishing);
	const resetSessionScreen = useSessionStore((state) => state.resetSessionScreen);

	const { sessionId, wordId, endsAt, sleep, duration, sleepChanged } = params;
	const runningSession = runningSessionData?.id === sessionId ? runningSessionData : null;
	const startedAt = runningSession?.period.started_at ?? null;
	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

	/** 학습 종료 함수 */
	const endSession = useCallback(
		async (reason: EndReason) => {
			if (endingRef.current) {
				return;
			}

			endingRef.current = true;

			setSessionFinishing(true);

			const learningMs = engineRef.current?.learningMs() ?? 0;
			const playCount = engineRef.current?.playCount() ?? 0;

			try {
				await engineRef.current?.stop();
				await Promise.allSettled([
					sendHeartbeatAsync({
						id: sessionId,
						data: createHeartbeatData(startedAt, sleep, engineRef.current?.unacknowledgedSegments() ?? []),
					}),
				]);
				engineRef.current = null;

				await Promise.allSettled(uploadsRef.current);
			} catch (e) {
				reportError(e, 'learning_end');
			}

			/** 학습 완료 화면 이동 함수 */
			const showSummary = () => {
				track('learning_finished', {
					session_id: sessionId,
					reason,
					learning_duration_ms: learningMs,
					total_duration_ms: startedAt ? dayjs().diff(startedAt) : 0,
					play_count: playCount,
					sound_count: soundCountRef.current,
				});

				navigation.replace('SessionSummary', { sessionId });
			};

			if (reason === 'server') {
				showSummary();

				return;
			}

			finishSession({ id: sessionId }, { onSettled: showSummary });
		},
		[finishSession, navigation, sendHeartbeatAsync, sessionId, setSessionFinishing, sleep, startedAt],
	);

	const latestInputRef = useRef({ startedAt, sleep, endSession });

	/** 화면 진입 시 세션 정보 표시 */
	useEffect(() => {
		showInfo();

		return () => resetSessionScreen();
	}, [resetSessionScreen, showInfo]);

	/** infoVisible 변경 시 세션 정보 fade 애니메이션 실행 */
	useEffect(() => {
		opacity.set(infoVisible ? 1 : withTiming(0, { duration: FADE_MS }));
	}, [infoVisible, opacity]);

	/** 안드로이드 뒤로 가기 버튼을 누르면 종료 다이얼로그 열기 */
	useEffect(() => {
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			showInfo();
			setEndDialogOpen(true);

			return true;
		});

		return () => subscription.remove();
	}, [showInfo]);

	/** 학습 엔진 실행 */
	useEffect(() => {
		if (!startedAt) {
			return;
		}

		let queue = queryClient
			.query({ ...getWordOptions({ id: wordId }), staleTime: 0 })
			.then(async (word) => {
				const createdEngine = createLearningEngine({
					wordId,
					recordingUrls: uploadedRecordings(word.recordings).map(({ audio_file }) => audio_file.url),
					startedAt: dayjs(startedAt).valueOf(),
					sleep,
					onSound: (sound) => {
						soundCountRef.current += 1;

						const uploadPromise: Promise<unknown> = uploadSessionSound({
							id: sessionId,
							uri: sound.uri,
							data: { captured_at: sound.capturedAt },
						})
							.catch((error: unknown) => reportError(error, 'session_sound_upload'))
							.finally(() => {
								uploadsRef.current = uploadsRef.current.filter((upload) => upload !== uploadPromise);
							});

						uploadsRef.current = [...uploadsRef.current, uploadPromise];
					},
					onError: (error) => reportError(error, 'learning_engine'),
				});

				engineRef.current = createdEngine;

				await createdEngine.start();

				track('learning_started', {
					session_id: sessionId,
					word_id: wordId,
					recording_count: uploadedRecordings(word.recordings).length,
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
					total_duration_ms: dayjs().diff(startedAt),
					play_count: 0,
					sound_count: 0,
				});

				setEngineFailed(true);
			});

		/** 엔진 작업을 순서대로 실행하는 함수 */
		const enqueue = (step: () => Promise<void> | undefined) => {
			queue = queue.then(step).catch((error: unknown) => reportError(error, 'learning_engine'));
		};

		const appStateSubscription = AppState.addEventListener('change', (appState) => {
			if (appState !== 'active' && engineRef.current && pausedAtRef.current === null) {
				pausedAtRef.current = dayjs().valueOf();

				track('learning_paused', { session_id: sessionId });
			} else if (appState === 'active' && pausedAtRef.current !== null) {
				track('learning_resumed', {
					session_id: sessionId,
					paused_ms: dayjs().diff(pausedAtRef.current),
				});

				pausedAtRef.current = null;
			}

			enqueue(() => (appState === 'active' ? engineRef.current?.resume() : engineRef.current?.pause()));
		});

		return () => {
			appStateSubscription.remove();

			enqueue(() => {
				const engine = engineRef.current;

				engineRef.current = null;

				return engine?.stop();
			});
		};
	}, [duration, sessionId, setEngineFailed, sleep, sleepChanged, startedAt, uploadSessionSound, wordId]);

	/** 하트비트 전송에 사용할 최신 값 저장 */
	useEffect(() => {
		latestInputRef.current = { startedAt, sleep, endSession };
	}, [endSession, sleep, startedAt]);

	/** 주기마다 하트비트 전송 */
	useEffect(() => {
		/** 하트비트 전송 함수 */
		const beat = () => {
			const { startedAt: sessionStartedAt, sleep: sleepSettings } = latestInputRef.current;
			const learningSegments = engineRef.current?.unacknowledgedSegments() ?? [];

			sendHeartbeatAsync({
				id: sessionId,
				data: createHeartbeatData(sessionStartedAt, sleepSettings, learningSegments),
			})
				.then((heartbeat) => engineRef.current?.acknowledgeSegments(heartbeat.acknowledged, learningSegments))
				.catch((error: unknown) => {
					if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
						void latestInputRef.current.endSession('server');
					}
				});
		};

		beat();

		const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

		return () => clearInterval(timer);
	}, [sendHeartbeatAsync, sessionId]);

	/** 종료 시각이 되면 학습 종료 */
	useEffect(() => {
		if (endsAt === null) {
			return;
		}

		const timer = setTimeout(() => void endSession('time_reached'), Math.max(0, endsAt - dayjs().valueOf()));

		return () => clearTimeout(timer);
	}, [endSession, endsAt]);

	const handleOpenEndDialog = () => {
		showInfo();
		setEndDialogOpen(true);
	};

	const handleEnd = () => {
		void endSession('user');
	};

	return (
		<PressableSurface
			variant="plain"
			depth="none"
			cornerRadius="none"
			faceColor={sessionColors.background}
			style={styles.screen}
			contentStyle={styles.fill}
			onPress={showInfo}
			accessibilityLabel={t('session.run.reveal')}
		>
			{/*세션 진행 정보*/}
			<Animated.View style={[styles.fill, fadeStyle]} pointerEvents={infoVisible ? 'box-none' : 'none'}>
				{!!startedAt && (
					<RunInfo
						startedAt={startedAt}
						endsAt={endsAt}
						sleep={sleep}
						engineFailed={engineFailed}
						onEnd={handleOpenEndDialog}
					/>
				)}
			</Animated.View>

			{/*학습 종료 확인 다이얼로그, 화면이 어두워지면 숨김*/}
			<ConfirmDialog
				visible={endDialogOpen && (infoVisible || sessionFinishing)}
				text={{
					title: t('session.end.title'),
					confirm: t('session.end.button'),
					cancel: t('session.end.keep'),
				}}
				confirmStatus={{ busy: sessionFinishing }}
				onConfirm={handleEnd}
				onClose={() => setEndDialogOpen(false)}
			>
				<View style={styles.endMessageContainer}>
					<Mascot size={88} />
					<Copy style={styles.endMessage}>{t('session.end.message')}</Copy>
				</View>
			</ConfirmDialog>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: sessionColors.background },
	fill: { flex: 1, borderWidth: 0 },
	endMessageContainer: { alignItems: 'center', gap: 12 },
	endMessage: { textAlign: 'center', lineHeight: 22 },
});

export default SessionRunScreen;
