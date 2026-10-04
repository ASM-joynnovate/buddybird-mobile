import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import dayjs from 'dayjs';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedProps,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { HOUR, MINUTE, SECOND } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const PHONE_WIDTH = 300;
const PHONE_HEIGHT = 440;
const GRAPH_WIDTH = 250;
const GRAPH_HEIGHT = 124;
const GRAPH_TOP = 12;
const GRAPH_BASE = 114;
const GRAPH_MAX_MS = 530 * MINUTE;
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];
const THIS_WEEK_TOTALS_MS = [0, 90 * MINUTE, 200 * MINUTE, 260 * MINUTE, 400 * MINUTE, 500 * MINUTE];
const LAST_WEEK_TOTALS_MS = [
	0,
	60 * MINUTE,
	150 * MINUTE,
	150 * MINUTE,
	280 * MINUTE,
	360 * MINUTE,
	420 * MINUTE,
	420 * MINUTE,
];
const GUIDE_LINES_MS = [3 * HOUR, 6 * HOUR];
const WORD_DURATION_MS = 200 * MINUTE;
const LINE_DRAW_DELAY_MS = 450;
const LINE_DRAW_MS = 0.9 * SECOND;

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

/** 누적 학습 시간을 그래프 좌표로 변환하는 함수 */
const toGraphPoint = (ms: number, index: number) => ({
	x: (index / WEEK_DAYS.length) * GRAPH_WIDTH,
	y: GRAPH_BASE - (ms / GRAPH_MAX_MS) * (GRAPH_BASE - GRAPH_TOP),
});

/** 누적 학습 시간 목록을 꺾은선 좌표 문자열로 변환하는 함수 */
const toPolylinePoints = (totalsMs: readonly number[]) =>
	totalsMs
		.map((ms, index) => {
			const { x, y } = toGraphPoint(ms, index);

			return `${x},${y}`;
		})
		.join(' ');

/** 꺾은선의 길이를 반환하는 함수 */
const getLineLength = (totalsMs: readonly number[]) =>
	totalsMs.slice(1).reduce((length, ms, index) => {
		const start = toGraphPoint(totalsMs[index], index);
		const end = toGraphPoint(ms, index + 1);

		return length + Math.hypot(end.x - start.x, end.y - start.y);
	}, 0);

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 이번 주와 지난주 학습 시간을 비교하는 리포트 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 꺾은선이 그려지는 움직임 실행 여부
 */
const UsageSceneReport = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const lineProgress = useSharedValue(1);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const words = t('onboarding.login.words', { returnObjects: true });
	const thisWeekLastIndex = THIS_WEEK_TOTALS_MS.length - 1;
	const thisWeekTotalMs = THIS_WEEK_TOTALS_MS[thisWeekLastIndex];
	const lastWeekTotalMs = LAST_WEEK_TOTALS_MS[LAST_WEEK_TOTALS_MS.length - 1];
	const changeMs = thisWeekTotalMs - LAST_WEEK_TOTALS_MS[thisWeekLastIndex];
	const thisWeekEnd = toGraphPoint(thisWeekTotalMs, thisWeekLastIndex);
	const thisWeekPoints = toPolylinePoints(THIS_WEEK_TOTALS_MS);
	const thisWeekLineLength = getLineLength(THIS_WEEK_TOTALS_MS);

	const lineProps = useAnimatedProps(() => ({
		strokeDashoffset: thisWeekLineLength * (1 - lineProgress.get()),
	}));

	/** 움직임이 켜져 있으면 이번 주 꺾은선이 그려짐 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		lineProgress.set(0);
		lineProgress.set(
			withDelay(LINE_DRAW_DELAY_MS, withTiming(1, { duration: LINE_DRAW_MS, easing: Easing.out(Easing.cubic) })),
		);

		return () => cancelAnimation(lineProgress);
	}, [animated, lineProgress]);

	return (
		<Animated.View
			entering={popIn(0)}
			style={[
				styles.phoneContainer,
				{ left: 46 * scale, top: 16 * scale, width: PHONE_WIDTH * scale, height: PHONE_HEIGHT * scale },
			]}
		>
			<View style={[styles.phone, { transform: [{ scale }] }]}>
				<View style={styles.phoneScreen}>
					<Copy style={styles.reportTitle}>{t('report.title')}</Copy>

					{/*이번 주와 지난주 학습 시간*/}
					<View style={styles.totalRow}>
						<View style={styles.thisWeekContainer}>
							<View style={styles.legendRow}>
								<View style={styles.thisWeekSwatch} />
								<Copy style={styles.legendText}>{t('report.periods.week')}</Copy>
							</View>
							<Copy style={styles.thisWeekTotal}>{formatDuration(thisWeekTotalMs, locale)}</Copy>
						</View>

						<View style={styles.lastWeekContainer}>
							<View style={styles.legendRow}>
								<Svg width={18} height={4}>
									<Line
										x1={2}
										x2={16}
										y1={2}
										y2={2}
										stroke={colors.subtle}
										strokeWidth={4}
										strokeLinecap="round"
										strokeDasharray="0.1 6"
									/>
								</Svg>
								<Copy style={styles.legendText}>{t('onboarding.usage.report.lastWeek')}</Copy>
							</View>
							<Copy style={styles.lastWeekTotal}>{formatDuration(lastWeekTotalMs, locale)}</Copy>
						</View>
					</View>
					<Copy style={styles.changeText}>
						{t('onboarding.usage.report.comparedToLastWeek', {
							duration: formatDuration(changeMs, locale),
						})}
					</Copy>

					{/*누적 학습 시간 그래프*/}
					<Svg
						width={GRAPH_WIDTH}
						height={GRAPH_HEIGHT}
						viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
						style={styles.graph}
					>
						<Polygon
							points={`0,${GRAPH_BASE} ${thisWeekPoints} ${thisWeekEnd.x},${GRAPH_BASE}`}
							fill={colors.orangePale}
						/>
						{GUIDE_LINES_MS.map((guideMs) => {
							const { y } = toGraphPoint(guideMs, 0);

							return (
								<G key={guideMs}>
									<Line
										x1={0}
										x2={GRAPH_WIDTH}
										y1={y}
										y2={y}
										stroke={colors.border}
										strokeWidth={2}
										strokeDasharray="2 6"
										strokeLinecap="round"
									/>
									<SvgText
										x={0}
										y={y - 5}
										fontFamily={font.extraBold}
										fontSize={10.5}
										fill={colors.muted}
									>
										{formatDuration(guideMs, locale)}
									</SvgText>
								</G>
							);
						})}
						<Line
							x1={0}
							x2={GRAPH_WIDTH}
							y1={GRAPH_BASE}
							y2={GRAPH_BASE}
							stroke={colors.border}
							strokeWidth={2}
						/>
						<Polyline
							points={toPolylinePoints(LAST_WEEK_TOTALS_MS)}
							fill="none"
							stroke={colors.subtle}
							strokeWidth={4}
							strokeLinecap="round"
							strokeDasharray="0.1 9"
						/>
						<AnimatedPolyline
							points={thisWeekPoints}
							fill="none"
							stroke={colors.orange}
							strokeWidth={5}
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeDasharray={`${thisWeekLineLength} ${thisWeekLineLength}`}
							animatedProps={lineProps}
						/>
						<Circle
							cx={thisWeekEnd.x}
							cy={thisWeekEnd.y}
							r={7}
							fill={colors.orange}
							stroke={colors.background}
							strokeWidth={3}
						/>
					</Svg>
					<View style={styles.axisRow}>
						{WEEK_DAYS.map((day) => (
							<Copy key={day} style={styles.axisText}>
								{dayjs().day(day).format('ddd')}
							</Copy>
						))}
					</View>

					<View style={styles.divider} />

					{/*단어별 학습 시간*/}
					<Copy style={styles.sectionTitle}>{t('report.learningTimeByWord')}</Copy>
					<View style={styles.wordRow}>
						<Copy numberOfLines={1} style={styles.wordName}>
							{words[0]}
						</Copy>
						<View style={styles.wordTrack}>
							<View style={styles.wordFill} />
						</View>
						<Copy style={styles.wordDuration}>{formatDuration(WORD_DURATION_MS, locale)}</Copy>
					</View>
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	phoneContainer: { position: 'absolute' },
	phone: {
		width: PHONE_WIDTH,
		height: PHONE_HEIGHT,
		padding: 7,
		borderRadius: 36,
		borderCurve: 'continuous',
		transformOrigin: 'left top',
		backgroundColor: colors.text,
	},
	phoneScreen: {
		flex: 1,
		paddingVertical: 16,
		paddingHorizontal: 18,
		borderRadius: 29,
		borderCurve: 'continuous',
		overflow: 'hidden',
		backgroundColor: colors.background,
	},
	reportTitle: { fontFamily: font.black, fontSize: 20, lineHeight: 26 },
	totalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 10 },
	thisWeekContainer: { flex: 1, minWidth: 0 },
	lastWeekContainer: { alignItems: 'flex-end', paddingBottom: 3 },
	legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	thisWeekSwatch: { width: 18, height: 5, borderRadius: radius.pill, backgroundColor: colors.orange },
	legendText: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.muted },
	thisWeekTotal: { fontFamily: font.black, fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'] },
	lastWeekTotal: {
		fontFamily: font.black,
		fontSize: 15,
		lineHeight: 20,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	changeText: { marginTop: 4, fontFamily: font.extraBold, fontSize: 12, lineHeight: 18, color: colors.orangeDark },
	graph: { marginTop: 12 },
	axisRow: { flexDirection: 'row', marginTop: 4 },
	axisText: {
		flex: 1,
		textAlign: 'center',
		fontFamily: font.extraBold,
		fontSize: 10.5,
		lineHeight: 16,
		color: colors.muted,
	},
	divider: { height: 2, marginTop: 14, marginBottom: 12, marginHorizontal: -18, backgroundColor: colors.border },
	sectionTitle: { marginBottom: 10, fontFamily: font.black, fontSize: 14, lineHeight: 20 },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	wordName: { width: 40, fontFamily: font.extraBold, fontSize: 13 },
	wordTrack: { flex: 1, height: 16, borderRadius: radius.small, backgroundColor: colors.surface },
	wordFill: { width: '84%', height: '100%', borderRadius: radius.pill, backgroundColor: colors.orange },
	wordDuration: { fontFamily: font.extraBold, fontSize: 13, fontVariant: ['tabular-nums'] },
});

export default UsageSceneReport;
