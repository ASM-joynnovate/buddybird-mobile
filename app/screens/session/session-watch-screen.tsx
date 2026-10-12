import { useEffect, useRef, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { RootStackParamList } from '@/types/navigation';

import { apiKeys } from '@/hooks/apis/keys';
import { getSessionOptions, useFinishSession } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useKeepAwake } from 'expo-keep-awake';
import { CameraOffIcon, ChevronLeftIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HEARTBEAT_INTERVAL_MS } from '@/config';
import CameraButton from '@/screens/session/components/camera-button';
import RunInfo from '@/screens/session/components/run-info';
import ZoomableView from '@/screens/session/components/zoomable-view';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ICON_SIZE = 22;

/** 다시 시도해도 결과가 같은 오류인지 판단하는 함수 */
const isFinalError = (error: unknown) => error instanceof ApiError && !error.retryable;

/** 다른 기기에서 진행 중인 학습을 지켜보는 화면 */
const SessionWatchScreen = () => {
	// 보는 화면이라 학습 화면과 달리 어두워지지 않음
	useKeepAwake();

	const { t } = useTranslation();

	const queryClient = useQueryClient();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionWatch'>>();

	// 영상 전송과 원격 카메라 제어(BB-657) 전까지는 이 화면 안의 상태로만 표시
	const [cameraOn, setCameraOn] = useState(false);
	const [streamReady] = useState(false);
	const [endDialogOpen, setEndDialogOpen] = useState(false);

	const leavingRef = useRef(false);

	// 진행 중 세션 목록 캐시는 이 기기에서 학습을 시작하지 않았으면 비어 있을 수 있어, 세션을 직접 조회
	const { data: session, error: sessionError } = useQuery({
		...getSessionOptions({ id: params.sessionId }),
		staleTime: 0,
		throwOnError: false,
		refetchInterval: HEARTBEAT_INTERVAL_MS,
	});
	const { mutate: finishSession, isPending: finishing, error: finishError } = useFinishSession();

	// 끝난 세션을 다시 종료하려 한 경우는 오류로 보지 않음
	const finishNotRunning = finishError instanceof ApiError && finishError.code === 'SESSION__NOT_RUNNING';
	const ended = session?.status === 'finished' || isFinalError(sessionError) || finishNotRunning;

	/** 학습이 끝나면 홈 정보를 새로 불러오고 홈으로 돌아가기 */
	useEffect(() => {
		if (!ended || leavingRef.current) {
			return;
		}

		leavingRef.current = true;

		void queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() });
		void queryClient.invalidateQueries({ queryKey: apiKeys.home() });

		navigation.goBack();
	}, [ended, navigation, queryClient]);

	const handleLeave = () => {
		navigation.goBack();
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

			{!!session && <CameraButton on={cameraOn} onPress={() => setCameraOn((on) => !on)} />}
		</View>
	);

	// 세션을 불러오는 중이거나 다시 시도 중이어도 나갈 수 있도록 헤더는 항상 표시
	if (!session || ended) {
		return (
			<SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
				<View style={styles.loadingHeader}>{header}</View>
				<View style={styles.loading}>
					<ActivityIndicator color={sessionColors.text} />
				</View>
			</SafeAreaView>
		);
	}

	const handleEnd = () => {
		finishSession({ id: session.id });
	};

	return (
		<View style={styles.screen}>
			{/*영상*/}
			{streamReady && (
				<ZoomableView>
					<View style={styles.screen} />
				</ZoomableView>
			)}

			{/*영상이 없을 때 안내*/}
			{!streamReady && (
				<View style={styles.statusContainer} pointerEvents="none">
					{cameraOn ? (
						<>
							<ActivityIndicator color={sessionColors.text} />
							<Copy style={styles.statusTitle}>{t('session.watch.connecting')}</Copy>
						</>
					) : (
						<>
							<CameraOffIcon size={28} color={sessionColors.text} />
							<Copy style={styles.statusTitle}>{t('session.watch.cameraOff.title')}</Copy>
							<Copy lineBreakStrategyIOS="hangul-word" style={styles.statusMessage}>
								{t('session.watch.cameraOff.message')}
							</Copy>
						</>
					)}
				</View>
			)}

			{/*세션 진행 정보*/}
			<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
				<RunInfo
					startedAt={session.period.started_at}
					endsAt={session.schedule.ends_at ? dayjs(session.schedule.ends_at).valueOf() : null}
					sleep={session.schedule.sleep}
					engineFailed={false}
					onEnd={() => setEndDialogOpen(true)}
					header={header}
				/>
			</View>

			{/*학습 종료 확인 다이얼로그*/}
			<ConfirmDialog
				visible={endDialogOpen}
				text={{
					title: t('session.end.title'),
					confirm: t('session.end.button'),
					cancel: t('session.end.keep'),
				}}
				confirmStatus={{
					busy: finishing,
					errorMessage: finishError && !finishNotRunning ? t('session.start.endElsewhereError') : null,
				}}
				onConfirm={handleEnd}
				onClose={() => setEndDialogOpen(false)}
			>
				<View style={styles.endMessageContainer}>
					<Mascot size={88} />
					<Copy style={styles.endMessage}>{t('session.end.message')}</Copy>
				</View>
			</ConfirmDialog>
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
	endMessageContainer: { alignItems: 'center', gap: 12 },
	endMessage: { textAlign: 'center', lineHeight: 22 },
});

export default SessionWatchScreen;
