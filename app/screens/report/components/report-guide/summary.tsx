import { useMemo, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportGuideTargetRegister } from '@/types/guide/report';

import { useTranslation } from 'react-i18next';

import {
	formatDuration,
	formatDurationChange,
	formatMonthDay,
	formatMonthDayWeekday,
	formatYearMonth,
} from '@/i18n/format';

import dayjs from 'dayjs';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import Animated, { type AnimatedRef, type SharedValue, useScrollOffset } from 'react-native-reanimated';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { MINUTE } from '@/config/units';
import ReportGuideTarget from '@/screens/report/components/report-guide/target';
import ReportHeaderCumulativeChart from '@/screens/report/components/report-header/cumulative-chart';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Surface } from '@/components/ui/surface';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CALENDAR_SIZE = 26;
const OCTOBER_MINUTES = [
	0, 0, 0, 0, 0, 0, 5, 2.5, 0, 0, 0, 0.5, 6, 15.5, 87, 36, 2, 3, 0, 0, 0, 0.5, 0, 0, 1, 0, 18, 1, 0, 2, 25,
];
const SEPTEMBER_MINUTES = [
	0, 0, 3, 0, 5, 0, 0, 12, 0, 8, 0, 0, 15, 0, 0, 20, 0, 0, 6, 0, 10, 0, 0, 9, 0, 0, 14, 0, 0, 8,
];

/** 날짜별 누적 학습 시간 계산 함수 */
const cumulativeTotalsMs = (dailyMinutes: number[]) => {
	return [
		0,
		...dailyMinutes.map((_, index) =>
			dailyMinutes.slice(0, index + 1).reduce((totalMs, minutes) => totalMs + minutes * MINUTE, 0),
		),
	];
};

interface Props {
	scrollRef: AnimatedRef<Animated.ScrollView>;
	scrollY: SharedValue<number>;
	wordName: string;
	onRegisterTarget: ReportGuideTargetRegister;
	onScrubEnd: () => void;
	onOpenSession: () => void;
}

/**
 * 예시 데이터로 그린 리포트 화면 컴포넌트
 * @param scrollRef 화면 스크롤
 * @param scrollY 화면 스크롤 위치
 * @param wordName 예시 단어
 * @param onRegisterTarget 강조 영역 등록 함수
 * @param onScrubEnd 그래프에서 손을 떼면 실행할 함수
 * @param onOpenSession 학습 항목을 누르면 실행할 함수
 */
const ReportGuideSummary = ({ scrollRef, scrollY, wordName, onRegisterTarget, onScrubEnd, onOpenSession }: Props) => {
	const { t } = useTranslation();

	const [scrubIndex, setScrubIndex] = useState<number | null>(null);

	const locale = useDeviceSettingsStore((state) => state.locale);

	useScrollOffset(scrollRef, scrollY);

	const trend = useMemo(
		() =>
			OCTOBER_MINUTES.map((minutes, index) => ({
				start: dayjs('2025-10-01').add(index, 'day').format(),
				duration_ms: minutes * MINUTE,
			})),
		[],
	);
	const currentTotalsMs = useMemo(() => cumulativeTotalsMs(OCTOBER_MINUTES), []);
	const previousTotalsMs = useMemo(() => cumulativeTotalsMs(SEPTEMBER_MINUTES), []);
	const shownIndex = scrubIndex ?? trend.length;
	const previousShownMs = previousTotalsMs[Math.min(shownIndex, previousTotalsMs.length - 1)];
	const changeMs = currentTotalsMs[shownIndex] - previousShownMs;
	const scrubbedBucket = scrubIndex === null ? null : trend[scrubIndex - 1];
	const totalLabel = formatDuration(currentTotalsMs[trend.length], locale);
	const previousTotalLabel = formatDuration(previousTotalsMs[SEPTEMBER_MINUTES.length], locale);
	const wordChangeMs = currentTotalsMs[trend.length] - previousTotalsMs[SEPTEMBER_MINUTES.length];

	const handleScrub = (index: number | null) => {
		if (index === null && scrubIndex !== null) {
			onScrubEnd();
		}

		setScrubIndex(index === null ? null : Math.min(Math.max(index, 1), trend.length));
	};

	return (
		<View style={styles.container}>
			<Animated.ScrollView
				ref={scrollRef}
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.content}
			>
				<View>
					<ScreenHeader
						title={t('report.title')}
						large
						trailing={
							<>
								{/*지난 기간 표시 시 오늘로 이동 버튼*/}
								<View style={styles.todayButton}>
									<Svg
										width={CALENDAR_SIZE}
										height={CALENDAR_SIZE}
										viewBox="0 0 24 24"
										fill="none"
										stroke={colors.orange}
										strokeWidth={2.2}
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<Rect x={3} y={4} width={18} height={18} rx={2} />
										<Path d="M16 2v4" />
										<Path d="M8 2v4" />
									</Svg>
									<Copy style={styles.today}>{dayjs().date()}</Copy>
								</View>
								<Surface depth="low" cornerRadius="pill" contentStyle={styles.periodMenu}>
									<Copy style={styles.periodMenuText}>{t('report.units.month')}</Copy>
									<ChevronDownIcon size={18} color={colors.muted} />
								</Surface>
							</>
						}
					/>
					<View style={styles.divider} />

					<ReportGuideTarget step="chart" onRegister={onRegisterTarget}>
						<View style={styles.navRow}>
							<Copy numberOfLines={1} style={styles.period}>
								{formatYearMonth('2025-10-01', locale)}
							</Copy>
							<View style={styles.navIcon}>
								<ChevronLeftIcon size={24} color={colors.text} />
							</View>
							<View style={styles.navIcon}>
								<ChevronRightIcon size={24} color={colors.text} />
							</View>
						</View>

						<View style={styles.totalsRow}>
							<View style={styles.currentContainer}>
								<View style={styles.legendRow}>
									<View style={styles.currentSwatch} />
									<Copy numberOfLines={1} style={styles.legendText}>
										{scrubbedBucket
											? t('report.until', { label: formatMonthDay(scrubbedBucket.start, locale) })
											: t('report.selectedPeriod')}
									</Copy>
								</View>
								<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.currentTotal}>
									{formatDuration(currentTotalsMs[shownIndex], locale)}
								</Copy>
							</View>

							<View style={styles.previousContainer}>
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
									<Copy style={styles.legendText}>{t('report.previousPeriods.month')}</Copy>
								</View>
								<Copy style={styles.previousTotal}>{formatDuration(previousShownMs, locale)}</Copy>
							</View>
						</View>
						<Copy style={[styles.changeText, changeMs > 0 && styles.increasedText]}>
							{t('report.change.month', { change: formatDurationChange(changeMs, locale) })}
						</Copy>

						<ReportHeaderCumulativeChart
							period="month"
							trend={trend}
							currentTotalsMs={currentTotalsMs}
							previousTotalsMs={previousTotalsMs}
							scrubIndex={scrubbedBucket ? shownIndex : null}
							tooltip={
								scrubbedBucket && {
									title: formatMonthDay(scrubbedBucket.start, locale),
									durationText: t('report.bucketDuration', {
										duration: formatDuration(scrubbedBucket.duration_ms, locale),
									}),
								}
							}
							lineAnimated
							accessibilityLabel={t('report.chartLabel', {
								period: t('report.selectedPeriod'),
								duration: totalLabel,
								previousPeriod: t('report.previousPeriods.month'),
								previousDuration: previousTotalLabel,
							})}
							onScrub={handleScrub}
						/>
					</ReportGuideTarget>

					<View style={styles.band} />
					<ReportGuideTarget step="wordBars" onRegister={onRegisterTarget}>
						<View style={styles.titleRow}>
							<Copy style={styles.wordBarsTitle}>{t('report.learningTimeByWord')}</Copy>
							<Copy style={styles.comparedTo}>{t('report.comparedTo.month')}</Copy>
						</View>
						<View style={styles.wordRow}>
							<Copy numberOfLines={1} style={styles.wordName}>
								{wordName}
							</Copy>
							<View style={styles.track}>
								<View style={styles.fill} />
							</View>
							<View style={styles.durationContainer}>
								<Copy style={styles.wordDuration}>{totalLabel}</Copy>
								<Copy style={[styles.wordChange, wordChangeMs > 0 && styles.increasedText]}>
									{formatDurationChange(wordChangeMs, locale)}
								</Copy>
							</View>
						</View>
					</ReportGuideTarget>

					<View style={styles.band} />
					<Copy style={styles.sessionsTitle}>{t('report.sessions')}</Copy>
				</View>

				<Copy style={styles.date}>{formatMonthDayWeekday('2025-10-31T15:22:00', locale)}</Copy>
				<ReportGuideTarget step="session" onRegister={onRegisterTarget}>
					<PressableSurface depth="low" onPress={onOpenSession} contentStyle={styles.sessionRow}>
						<View style={styles.textContainer}>
							<Copy numberOfLines={1} style={styles.sessionWord}>
								{wordName}
							</Copy>
							<Copy style={styles.time}>{dayjs('2025-10-31T15:22:00').format('LT')}</Copy>
						</View>
						<Copy style={styles.sessionDuration}>{formatDuration(13 * MINUTE, locale)}</Copy>
					</PressableSurface>
				</ReportGuideTarget>
				<Surface depth="low" contentStyle={styles.sessionRow}>
					<View style={styles.textContainer}>
						<Copy numberOfLines={1} style={styles.sessionWord}>
							{wordName}
						</Copy>
						<Copy style={styles.time}>{dayjs('2025-10-31T13:10:00').format('LT')}</Copy>
					</View>
					<Copy style={styles.sessionDuration}>{formatDuration(12 * MINUTE, locale)}</Copy>
				</Surface>

				<Copy style={[styles.date, styles.laterDate]}>
					{formatMonthDayWeekday('2025-10-30T16:05:00', locale)}
				</Copy>
				<Surface depth="low" contentStyle={styles.sessionRow}>
					<View style={styles.textContainer}>
						<Copy numberOfLines={1} style={styles.sessionWord}>
							{wordName}
						</Copy>
						<Copy style={styles.time}>{dayjs('2025-10-30T16:05:00').format('LT')}</Copy>
					</View>
					<Copy style={styles.sessionDuration}>{formatDuration(2 * MINUTE, locale)}</Copy>
				</Surface>

				<Copy style={[styles.date, styles.laterDate]}>
					{formatMonthDayWeekday('2025-10-28T14:40:00', locale)}
				</Copy>
				<Surface depth="low" contentStyle={styles.sessionRow}>
					<View style={styles.textContainer}>
						<Copy numberOfLines={1} style={styles.sessionWord}>
							{wordName}
						</Copy>
						<Copy style={styles.time}>{dayjs('2025-10-28T14:40:00').format('LT')}</Copy>
					</View>
					<Copy style={styles.sessionDuration}>{formatDuration(MINUTE, locale)}</Copy>
				</Surface>
			</Animated.ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24 },
	content: { flexGrow: 1, paddingTop: 12, paddingBottom: 24, gap: 10 },
	todayButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	today: {
		position: 'absolute',
		top: 19,
		right: 0,
		left: 0,
		textAlign: 'center',
		fontFamily: font.black,
		fontSize: 10,
		lineHeight: 12,
		color: colors.orange,
		fontVariant: ['tabular-nums'],
	},
	periodMenu: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 14, paddingRight: 8 },
	periodMenuText: { fontFamily: font.extraBold, fontSize: 13.5 },
	divider: { height: 2, marginHorizontal: -24, marginBottom: 8, backgroundColor: colors.border },
	navRow: { flexDirection: 'row', alignItems: 'center' },
	period: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 14.5 },
	navIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	totalsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
	currentContainer: { flex: 1, minWidth: 0 },
	previousContainer: { alignItems: 'flex-end', paddingBottom: 3 },
	legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	currentSwatch: { width: 18, height: 5, borderRadius: radius.pill, backgroundColor: colors.orange },
	legendText: { fontFamily: font.extraBold, fontSize: 12.5, lineHeight: 18, color: colors.muted },
	currentTotal: { fontFamily: font.black, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
	previousTotal: {
		fontFamily: font.black,
		fontSize: 16,
		lineHeight: 22,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	changeText: {
		marginTop: 6,
		fontFamily: font.extraBold,
		fontSize: 12.5,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	increasedText: { color: colors.orangeDark },
	band: {
		height: 10,
		marginHorizontal: -24,
		marginVertical: 22,
		borderTopWidth: 2,
		borderTopColor: colors.border,
		backgroundColor: colors.surface,
	},
	titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
	wordBarsTitle: { flex: 1, fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	comparedTo: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
	wordName: { width: 96, fontFamily: font.extraBold, fontSize: 14 },
	track: { flex: 1, height: 19, borderRadius: 8, backgroundColor: colors.surface },
	fill: {
		height: 19,
		borderRadius: 8,
		borderBottomWidth: 3,
		borderBottomColor: colors.orangeDark,
		backgroundColor: colors.orange,
	},
	durationContainer: { minWidth: 78, alignItems: 'flex-end' },
	wordDuration: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
	wordChange: {
		fontFamily: font.extraBold,
		fontSize: 11.5,
		lineHeight: 15,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	sessionsTitle: { fontFamily: font.black, fontSize: 16, lineHeight: 22, marginBottom: 2 },
	date: { fontFamily: font.extraBold, fontSize: 12.5, lineHeight: 18, color: colors.muted },
	laterDate: { marginTop: 8 },
	sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 3 },
	sessionWord: { flexShrink: 1, fontFamily: font.black, fontSize: 15, lineHeight: 20 },
	time: { fontSize: 12, lineHeight: 16, color: colors.muted },
	sessionDuration: { fontFamily: font.extraBold, fontSize: 14, fontVariant: ['tabular-nums'] },
});

export default ReportGuideSummary;
