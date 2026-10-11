import { useEffect, useRef, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getSessionOptions, useFinishSession } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useKeepAwake } from 'expo-keep-awake';
import { CameraOffIcon, ChevronLeftIcon } from 'lucide-react-native';

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

/** 다른 기기에서 진행 중인 학습을 지켜보는 화면 */
const SessionWatchScreen = () => {
	// 보는 화면이라 학습 화면과 달리 어두워지지 않음
	useKeepAwake();

	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionWatch'>>();

	// 영상 전송과 원격 카메라 제어(BB-657) 전까지는 이 화면 안의 상태로만 표시
	const [cameraOn, setCameraOn] = useState(false);
	const [streamReady] = useState(false);
	const [endDialogOpen, setEndDialogOpen] = useState(false);

	const leavingRef = useRef(false);

	// 진행 중 세션 목록 캐시는 이 기기에서 학습을 시작하지 않았으면 비어 있을 수 있어, 세션을 직접 조회
	const { data: session } = useQuery({
		...getSessionOptions({ id: params.sessionId }),
		staleTime: 0,
		throwOnError: false,
		refetchInterval: HEARTBEAT_INTERVAL_MS,
	});
	const { mutate: finishSession, isPending: finishing, isError: finishFailed } = useFinishSession();

	const finished = session?.status === 'finished';

	/** 학습이 끝나면 홈으로 돌아가기 */
	useEffect(() => {
		if (!finished || leavingRef.current) {
			return;
		}

		leavingRef.current = true;

		navigation.goBack();
	}, [finished, navigation]);

	if (!session || finished) {
		return <View style={styles.screen} />;
	}

	const handleLeave = () => {
		navigation.goBack();
	};

	const handleEnd = () => {
		finishSession({ id: session.id });
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

			<CameraButton on={cameraOn} onPress={() => setCameraOn((on) => !on)} />
		</View>
	);

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
					errorMessage: finishFailed ? t('session.start.endElsewhereError') : null,
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
