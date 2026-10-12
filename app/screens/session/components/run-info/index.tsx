import { useEffect, useState } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { formatTimer } from '@/i18n/format';

import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SESSION_INFO_HIDE_MS } from '@/config';
import { SECOND } from '@/config/units';
import BatteryStatus from '@/screens/session/components/run-info/battery-status';
import SessionProgressArc from '@/screens/session/components/run-info/session-progress-arc';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';
import { runStatus } from '@/utils/phases';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ARC_MAX_WIDTH = 460;
const RING_WIDTH = 240;
const SCREEN_PADDING = 24;

interface Props {
	startedAt: string;
	endsAt: number | null;
	sleep: SleepSettings | null;
	engineFailed: boolean;
	onEnd: () => void;
}

/**
 * 세션 진행 정보 컴포넌트
 * @param startedAt 세션 시작 시각
 * @param endsAt 학습 종료 시각
 * @param sleep 수면 시간 설정
 * @param engineFailed 학습 엔진 시작 실패 여부
 * @param onEnd 종료 버튼을 누를 때 실행할 함수
 */
const RunInfo = ({ startedAt, endsAt, sleep, engineFailed, onEnd }: Props) => {
	const { t } = useTranslation();

	const { width, height } = useWindowDimensions();

	const [now, setNow] = useState(() => dayjs().valueOf());

	const status = runStatus(startedAt, endsAt, sleep, now);
	const isLandscape = width > height;
	const arcWidth = Math.min(width - SCREEN_PADDING * 2, ARC_MAX_WIDTH);

	const currentPhase = (
		<View style={styles.phaseContainer} pointerEvents="none">
			<Copy style={styles.phaseText}>{t(`common.phases.${status.phase}`)}</Copy>
		</View>
	);
	const sessionTime = (
		<View style={styles.sessionTimeContainer}>
			<Copy style={styles.sessionTimeLabel}>
				{status.remainingMs === null ? t('session.run.elapsed') : t('session.run.remaining')}
			</Copy>
			<Copy style={styles.sessionTimeText}>{formatTimer(status.remainingMs ?? dayjs(now).diff(startedAt))}</Copy>
		</View>
	);
	const endButton = (
		<PressableSurface
			depth="high"
			cornerRadius="control"
			edgeColor={sessionColors.edge}
			faceColor={sessionColors.background}
			contentStyle={styles.endFace}
			accessibilityLabel={t('session.end.title')}
			onPress={onEnd}
		>
			<Copy style={styles.endText}>{t('session.end.button')}</Copy>
		</PressableSurface>
	);

	/** 1초마다 현재 시각 갱신 */
	useEffect(() => {
		const timer = setInterval(() => setNow(dayjs().valueOf()), SECOND);

		return () => clearInterval(timer);
	}, []);

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
			{/*헤더*/}
			<View style={styles.topRow}>
				<View style={styles.noticeContainer}>
					<Copy lineBreakStrategyIOS="hangul-word" style={styles.noticeText}>
						{t('session.run.keepOpen')}
					</Copy>
					<Copy lineBreakStrategyIOS="hangul-word" style={styles.noticeText}>
						{t('session.run.dimAfter', { seconds: SESSION_INFO_HIDE_MS / SECOND })}
					</Copy>
					{engineFailed && (
						<Copy lineBreakStrategyIOS="hangul-word" style={styles.noticeText}>
							{t('session.run.engineError')}
						</Copy>
					)}
				</View>

				<BatteryStatus />
			</View>

			{isLandscape ? (
				<View style={styles.splitRow} pointerEvents="box-none">
					{/*진행률 원 그래프*/}
					<View style={styles.ringContainer}>
						<SessionProgressArc
							width={RING_WIDTH}
							variant="full"
							phase={status.phase}
							progressRatio={status.progressRatio}
						>
							{sessionTime}
						</SessionProgressArc>
					</View>

					<View style={styles.divider} />

					<View style={styles.phaseEndContainer} pointerEvents="box-none">
						{currentPhase}
						{endButton}
					</View>
				</View>
			) : (
				<>
					{currentPhase}

					{/*진행률 반원 그래프*/}
					<View style={[styles.bottomContainer, { width: arcWidth }]} pointerEvents="box-none">
						<SessionProgressArc
							width={arcWidth}
							variant="half"
							phase={status.phase}
							progressRatio={status.progressRatio}
						>
							{sessionTime}
						</SessionProgressArc>
						{endButton}
					</View>
				</>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
	topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
	noticeContainer: { flex: 1 },
	noticeText: { fontFamily: font.extraBold, fontSize: 13, lineHeight: 18, color: sessionColors.faint },
	phaseContainer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
	phaseText: { fontFamily: font.black, fontSize: 34, lineHeight: 40, color: sessionColors.text },
	sessionTimeContainer: { alignItems: 'center', gap: 2 },
	sessionTimeLabel: { fontFamily: font.extraBold, fontSize: 15, color: sessionColors.faint },
	sessionTimeText: {
		fontFamily: font.black,
		fontSize: 34,
		lineHeight: 40,
		color: sessionColors.text,
		fontVariant: ['tabular-nums'],
	},
	splitRow: { flex: 1, flexDirection: 'row', gap: 40, marginTop: 12 },
	ringContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	divider: { width: 2, height: '50%', alignSelf: 'center', borderRadius: 1, backgroundColor: sessionColors.edge },
	phaseEndContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 16 },
	bottomContainer: { alignSelf: 'center', gap: 16, paddingBottom: 16 },
	endFace: { minHeight: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
	endText: { fontFamily: font.extraBold, fontSize: 20, color: sessionColors.text },
});

export default RunInfo;
