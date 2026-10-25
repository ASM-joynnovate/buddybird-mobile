import { useEffect, useRef, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { RootStackParamList } from '@/types/navigation';
import type { PetcamState } from '@/types/petcam';

import { homeKeys } from '@/hooks/apis/keys/home';
import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { useIssuePetcamTurnCredential } from '@/hooks/apis/petcam';
import { useFinishSession, useGetSessionQuery } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useKeepAwake } from 'expo-keep-awake';
import { CameraOffIcon, ChevronLeftIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type MediaStream, RTCView } from 'react-native-webrtc';
import { toast } from 'sonner-native';

import { HEARTBEAT_INTERVAL_MS, SESSION_INFO_FADE_MS } from '@/config/policy';
import CameraButton from '@/screens/session/components/camera-button';
import SessionEndDialog from '@/screens/session/components/session-end-dialog';
import SessionRunInfo from '@/screens/session/components/session-run-info';
import ZoomableView from '@/screens/session/components/zoomable-view';
import { createPetcamReceiver, type PetcamReceiver } from '@/screens/session/services/petcam-connection';
import { recordPetcamVideoStats } from '@/screens/session/services/petcam-telemetry';
import { getPetcamCameraRequestTimeoutMs, getPetcamConnectTimeoutMs } from '@/services/remote-config/client';
import { reportError } from '@/services/telemetry/client';
import { useSessionStore } from '@/stores/session';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { dialogToasterId, Toast } from '@/components/ui/toast';

const ICON_SIZE = 22;

/** 영상이 없을 때 표시할 안내를 반환하는 함수 */
const watchStatus = (petcamState: PetcamState | null, stationUnreachable: boolean) => {
	if (!petcamState) {
		return stationUnreachable ? 'unreachable' : 'connecting';
	}

	if (petcamState.cameraOn) {
		return 'connecting';
	}

	return petcamState.permissionDenied ? 'permission' : 'cameraOff';
};

/** 다른 기기의 학습을 보는 화면 */
const SessionWatchScreen = () => {
	useKeepAwake();

	const { t } = useTranslation();

	const queryClient = useQueryClient();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionWatch'>>();

	const opacity = useSharedValue(1);

	const [endDialogOpen, setEndDialogOpen] = useState(false);
	const [petcamState, setPetcamState] = useState<PetcamState | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [stationUnreachable, setStationUnreachable] = useState(false);
	const [cameraRequestPending, setCameraRequestPending] = useState(false);

	const leavingRef = useRef(false);
	const petcamReceiverRef = useRef<PetcamReceiver | null>(null);

	const { data: sessionData, error: sessionError } = useGetSessionQuery(
		{ id: params.sessionId },
		{ staleTime: 0, refetchInterval: HEARTBEAT_INTERVAL_MS },
	);

	const { mutate: finishSession, isPending: sessionFinishing, error: finishError } = useFinishSession();
	const { mutateAsync: issuePetcamTurnCredential } = useIssuePetcamTurnCredential();

	const infoVisible = useSessionStore((state) => state.infoVisible);

	const showInfo = useSessionStore((state) => state.showInfo);
	const resetSessionScreen = useSessionStore((state) => state.resetSessionScreen);

	const cameraOn = petcamState?.cameraOn ?? false;
	const status = watchStatus(petcamState, stationUnreachable);
	const infoShown = infoVisible || !stream;
	const sessionNotRunning = finishError instanceof ApiError && finishError.code === 'SESSION__NOT_RUNNING';
	const sessionEnded =
		sessionData?.status === 'finished' ||
		(sessionError instanceof ApiError && !sessionError.retryable) ||
		sessionNotRunning;
	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

	/** 영상 변경 시 학습 정보 표시 */
	useEffect(() => {
		showInfo();

		return () => resetSessionScreen();
	}, [resetSessionScreen, showInfo, stream]);

	/** 학습 정보 fade 애니메이션 실행 */
	useEffect(() => {
		opacity.set(infoShown ? 1 : withTiming(0, { duration: SESSION_INFO_FADE_MS }));
	}, [infoShown, opacity]);

	/** Station과 연결할 채널 생성 */
	useEffect(() => {
		const receiver = createPetcamReceiver({
			sessionId: params.sessionId,
			issueTurnCredential: issuePetcamTurnCredential,
			onState: (state) => {
				setPetcamState(state);
				setCameraRequestPending(false);
			},
			onStream: setStream,
			onVideoStats: (stats) => recordPetcamVideoStats('receiver', stats),
			onError: (error) => reportError(error, 'petcam_receiver'),
		});

		petcamReceiverRef.current = receiver;

		return () => {
			petcamReceiverRef.current = null;

			receiver.close();
		};
	}, [issuePetcamTurnCredential, params.sessionId]);

	/** Station 응답이 없으면 안내 표시 */
	useEffect(() => {
		if (petcamState) {
			return;
		}

		const timer = setTimeout(() => setStationUnreachable(true), getPetcamConnectTimeoutMs());

		return () => clearTimeout(timer);
	}, [petcamState]);

	/** 응답이 없으면 카메라 요청 취소 */
	useEffect(() => {
		if (!cameraRequestPending) {
			return;
		}

		const timer = setTimeout(() => setCameraRequestPending(false), getPetcamCameraRequestTimeoutMs());

		return () => clearTimeout(timer);
	}, [cameraRequestPending]);

	/** 학습이 끝나면 화면 나가기 */
	useEffect(() => {
		if (!sessionEnded || leavingRef.current) {
			return;
		}

		leavingRef.current = true;

		void queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
		void queryClient.invalidateQueries({ queryKey: homeKeys.all() });

		if (params.source === 'notification') {
			navigation.popTo('Main', {
				screen: 'ReportTab',
				params: {
					screen: 'SessionDetail',
					params: { sessionId: params.sessionId, source: 'notification' },
					initial: false,
				},
			});

			return;
		}

		navigation.goBack();
	}, [navigation, params.sessionId, params.source, queryClient, sessionEnded]);

	const handleLeave = () => {
		if (leavingRef.current) {
			return;
		}

		leavingRef.current = true;

		navigation.goBack();
	};

	const handleToggleCamera = () => {
		if (cameraRequestPending) {
			return;
		}

		showInfo();
		setCameraRequestPending(true);

		petcamReceiverRef.current?.setCamera(!cameraOn);
	};

	const handleOpenEndDialog = () => {
		showInfo();
		setEndDialogOpen(true);
	};

	const handleEnd = () => {
		if (sessionFinishing) {
			return;
		}

		finishSession(
			{ id: params.sessionId },
			{
				onError: (error) => {
					if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
						return;
					}

					toast.custom(<Toast variant="error" message={t('session.start.endElsewhereError')} />, {
						toasterId: dialogToasterId,
					});
				},
			},
		);
	};

	const header = (
		<View style={styles.header}>
			<PressableSurface
				variant="plain"
				depth="none"
				cornerRadius="control"
				contentStyle={styles.leaveFace}
				accessibilityLabel={t('session.watch.leave')}
				onPress={handleLeave}
			>
				<ChevronLeftIcon size={ICON_SIZE} color={sessionColors.overlayText} />
				<Copy style={styles.leaveText}>{t('session.watch.leave')}</Copy>
			</PressableSurface>

			{!!sessionData && (
				<CameraButton cameraOn={cameraOn} loading={cameraRequestPending} onPress={handleToggleCamera} />
			)}
		</View>
	);

	if (!sessionData || sessionEnded) {
		return (
			<SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
				<View style={styles.loadingHeader}>{header}</View>
				<View style={styles.loading}>
					<ActivityIndicator color={sessionColors.text} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.screen}>
			{!!stream && (
				<ZoomableView onTap={showInfo}>
					<RTCView streamURL={stream.toURL()} objectFit="cover" style={styles.screen} />
				</ZoomableView>
			)}

			{/*영상이 없을 때 안내*/}
			{!stream && (
				<View style={styles.statusContainer} pointerEvents="none">
					{status === 'connecting' ? (
						<ActivityIndicator
							accessible
							accessibilityLabel={t('session.watch.connecting')}
							color={sessionColors.text}
						/>
					) : (
						<>
							<CameraOffIcon size={28} color={sessionColors.text} />
							<Copy style={styles.statusTitle}>{t(`session.watch.${status}.title`)}</Copy>
							<Copy lineBreakStrategyIOS="hangul-word" style={styles.statusMessage}>
								{t(`session.watch.${status}.message`)}
							</Copy>
						</>
					)}
				</View>
			)}

			<Animated.View style={[StyleSheet.absoluteFill, fadeStyle]} pointerEvents={infoShown ? 'box-none' : 'none'}>
				<SessionRunInfo
					startedAt={sessionData.period.started_at}
					endsAt={sessionData.schedule.ends_at ? dayjs(sessionData.schedule.ends_at).valueOf() : null}
					sleep={sessionData.schedule.sleep}
					pauseNotice={stream ? t('session.watch.learningPaused') : null}
					onEnd={handleOpenEndDialog}
					header={header}
				/>
			</Animated.View>

			<SessionEndDialog
				visible={endDialogOpen}
				sessionFinishing={sessionFinishing}
				onConfirm={handleEnd}
				onClose={() => setEndDialogOpen(false)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: sessionColors.background },
	loadingHeader: { paddingHorizontal: 24, paddingTop: 12 },
	loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	leaveFace: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 8, marginLeft: -6 },
	leaveText: { fontFamily: font.extraBold, fontSize: 16, color: sessionColors.overlayText },
	statusContainer: {
		position: 'absolute',
		top: '18%',
		left: 32,
		right: 32,
		alignItems: 'center',
		gap: 8,
	},
	statusTitle: { fontFamily: font.extraBold, fontSize: 16, color: sessionColors.overlayText, textAlign: 'center' },
	statusMessage: {
		fontFamily: font.bold,
		fontSize: 14,
		lineHeight: 20,
		color: sessionColors.text,
		textAlign: 'center',
	},
});

export default SessionWatchScreen;
