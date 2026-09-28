import { useEffect, useState } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { formatTimer } from '@/i18n/format';

import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';

import SessionProgressArc from '@/screens/session/components/run-info/session-progress-arc';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';
import { runStatus } from '@/utils/phases';
import { SECOND } from '@/utils/units';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ARC_MAX_WIDTH = 460;

interface Props {
	startedAt: string;
	endsAt: number | null;
	sleep: SleepSettings;
	engineFailed: boolean;
	onEnd: () => void;
}

/**
 * 세션 경과 시간, 앱을 켜 두라는 안내, 진행 단계와 남은 시간, 종료 버튼을 보여 주고 종료 버튼을 누르면 onEnd를 실행하는 컴포넌트
 * @param startedAt 세션 시작 시각
 * @param endsAt 학습 종료 시각의 밀리초 값, 정하지 않았으면 null
 * @param sleep 수면 시간 설정
 * @param engineFailed 학습 엔진 시작 실패 여부
 * @param onEnd 종료 버튼을 누를 때 실행할 함수
 */
const RunInfo = ({ startedAt, endsAt, sleep, engineFailed, onEnd }: Props) => {
	const { t } = useTranslation();

	const { width } = useWindowDimensions();

	const [now, setNow] = useState(() => dayjs().valueOf());

	const status = runStatus(startedAt, endsAt, sleep, now);

	/** 1초마다 현재 시각 갱신 */
	useEffect(() => {
		const timer = setInterval(() => setNow(dayjs().valueOf()), SECOND);

		return () => clearInterval(timer);
	}, []);

	return (
		<SafeAreaView style={styles.info} edges={['top', 'bottom', 'left', 'right']}>
			{/*경과 시간과 안내*/}
			<View style={styles.stack}>
				<Copy style={styles.label}>{t('session.run.elapsed')}</Copy>
				<Copy style={styles.timer}>{formatTimer(dayjs(now).diff(startedAt))}</Copy>

				<Copy style={[styles.label, styles.keepOpen]}>{t('session.run.keepOpen')}</Copy>
				{engineFailed && <Copy style={styles.label}>{t('session.run.engineError')}</Copy>}
			</View>

			{/*진행 단계와 종료 버튼*/}
			<View style={styles.bottom} pointerEvents="box-none">
				<SessionProgressArc
					width={Math.min(width * 0.55, ARC_MAX_WIDTH)}
					phase={status.phase}
					progressRatio={status.progressRatio}
					title={t(`common.phases.${status.phase}`)}
					detail={
						status.remainingMs === null
							? null
							: t('session.run.remaining', { time: formatTimer(status.remainingMs) })
					}
				/>

				<PressableSurface
					depth="low"
					cornerRadius="control"
					edgeColor={sessionColors.edge}
					faceColor={sessionColors.background}
					style={styles.end}
					contentStyle={styles.endFace}
					accessibilityLabel={t('session.end.title')}
					onPress={onEnd}
				>
					<Copy style={styles.endText}>{t('session.end.button')}</Copy>
				</PressableSurface>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	info: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
	stack: { gap: 2 },
	label: { fontFamily: font.extraBold, fontSize: 13, color: sessionColors.faint },
	keepOpen: { marginTop: 12 },
	timer: {
		fontFamily: font.black,
		fontSize: 22,
		color: sessionColors.text,
		fontVariant: ['tabular-nums'],
	},
	bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
	end: { position: 'absolute', right: 0, bottom: 16 },
	endFace: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
	endText: { fontFamily: font.extraBold, fontSize: 15, color: sessionColors.text },
});

export default RunInfo;
