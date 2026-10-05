import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { ReportPeriod } from '@/types/report-period';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import {
	Circle,
	DashPathEffect,
	Group,
	Line as SkiaLine,
	Text as SkiaText,
	useFont,
	vec,
} from '@shopify/react-native-skia';
import dayjs, { type Dayjs } from 'dayjs';
import { Easing, type SharedValue, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Area, CartesianChart, Line, useChartPressState } from 'victory-native';

import { HOUR, MINUTE } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const GUIDE_FONT: number = require('@assets/fonts/Pretendard-ExtraBold.otf');
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 12, bottom: 10, left: 3, right: 10 };
const GUIDE_STEPS_MS = [30 * MINUTE, HOUR, 2 * HOUR, 3 * HOUR, 4 * HOUR, 5 * HOUR, 10 * HOUR, 15 * HOUR, 20 * HOUR];
const MAX_GUIDE_COUNT = 3;
const TOP_MARGIN_RATIO = 1.06;
const SCRUB_HOLD_MS = 220;
const LINE_DRAW_MS = 700;
const TOOLTIP_GAP = 10;

/** 기간에 맞는 x축 라벨을 반환하는 함수 */
const formatAxisLabel = (period: ReportPeriod, date: Dayjs, t: TFunction) => {
	if (period === 'week') {
		return date.format('ddd');
	}

	if (period === 'day') {
		return date.hour() % 6 === 0 ? t('report.chartHour', { hour: date.hour() }) : '';
	}

	return (date.date() - 1) % 7 === 0 ? String(date.date()) : '';
};

interface DotProps {
	x: number;
	y: number;
	radius: number;
	color: string;
	opacity?: SharedValue<number>;
}

/**
 * 흰 테두리가 있는 점 컴포넌트
 * @param x 점의 x 좌표
 * @param y 점의 y 좌표
 * @param radius 점의 반지름
 * @param color 점의 색
 * @param opacity 점의 불투명도
 */
const EdgedDot = ({ x, y, radius, color, opacity }: DotProps) => {
	return (
		<Group opacity={opacity}>
			<Circle cx={x} cy={y} r={radius + 1.5} color={colors.background} />
			<Circle cx={x} cy={y} r={radius - 1.5} color={color} />
		</Group>
	);
};

interface Props {
	period: ReportPeriod;
	trend: Report['active']['trend'];
	currentTotalsMs: number[];
	previousTotalsMs: number[];
	scrubIndex: number | null;
	tooltip: { title: string; detail: string } | null;
	lineAnimated: boolean;
	accessibilityLabel: string;
	onScrub: (index: number | null) => void;
}

/**
 * 누적 학습 시간 그래프 컴포넌트
 * @param period 리포트 기간 단위
 * @param trend 구간별 학습 시간
 * @param currentTotalsMs 이 기간의 구간별 누적 학습 시간
 * @param previousTotalsMs 지난 기간의 구간별 누적 학습 시간
 * @param scrubIndex 훑고 있는 구간 번호
 * @param tooltip 훑고 있는 구간의 말풍선 문구
 * @param lineAnimated 선이 그려지는 움직임 실행 여부
 * @param accessibilityLabel 그래프 설명 문구
 * @param onScrub 훑는 구간이 바뀔 때 실행할 함수
 */
const CumulativeChart = ({
	period,
	trend,
	currentTotalsMs,
	previousTotalsMs,
	scrubIndex,
	tooltip,
	lineAnimated,
	accessibilityLabel,
	onScrub,
}: Props) => {
	const { t } = useTranslation();

	const [chartWidth, setChartWidth] = useState(0);
	const [tooltipWidth, setTooltipWidth] = useState(0);

	const lineProgress = useSharedValue(lineAnimated ? 0 : 1);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const guideFont = useFont(GUIDE_FONT, 11);

	const { state: pressState } = useChartPressState({ x: 0, y: { current: 0, previous: 0 } });

	const bucketCount = trend.length;
	const lastIndex = currentTotalsMs.length - 1;
	const topMs =
		Math.max(
			currentTotalsMs[lastIndex],
			previousTotalsMs[Math.min(bucketCount, previousTotalsMs.length - 1)],
			MINUTE,
		) * TOP_MARGIN_RATIO;
	const guideStepMs =
		GUIDE_STEPS_MS.find((stepMs) => topMs / stepMs <= MAX_GUIDE_COUNT) ?? GUIDE_STEPS_MS[GUIDE_STEPS_MS.length - 1];
	const guidesMs = Array.from({ length: Math.floor(topMs / guideStepMs) }, (_, index) => (index + 1) * guideStepMs);
	const points = Array.from({ length: bucketCount + 1 }, (_, index) => ({
		index,
		current: index <= lastIndex ? currentTotalsMs[index] : null,
		previous: index < previousTotalsMs.length ? previousTotalsMs[index] : null,
	}));
	const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
	const cursorX = CHART_PADDING.left + ((scrubIndex ?? 0) / bucketCount) * plotWidth;
	const tooltipLeft =
		cursorX > tooltipWidth + TOOLTIP_GAP ? cursorX - tooltipWidth - TOOLTIP_GAP : cursorX + TOOLTIP_GAP;

	/** 그래프를 누르고 있다가 끄는 동안 손가락 아래 구간 번호를 전달 */
	useAnimatedReaction(
		() => (pressState.isActive.get() ? pressState.matchedIndex.get() : null),
		(index, previousIndex) => {
			if (index !== previousIndex) {
				scheduleOnRN(onScrub, index);
			}
		},
	);

	/** 이 기간의 선이 왼쪽부터 그려짐 */
	useEffect(() => {
		lineProgress.set(withTiming(1, { duration: LINE_DRAW_MS, easing: Easing.out(Easing.cubic) }));
	}, [lineProgress]);

	return (
		<View>
			<View
				accessible
				accessibilityRole="image"
				accessibilityLabel={accessibilityLabel}
				style={styles.chartContainer}
				onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
			>
				<CartesianChart
					data={points}
					xKey="index"
					yKeys={['current', 'previous']}
					domain={{ x: [0, bucketCount], y: [0, topMs] }}
					padding={CHART_PADDING}
					yAxis={[{ lineWidth: 0 }]}
					chartPressState={pressState}
					chartPressConfig={{ pan: { activateAfterLongPress: SCRUB_HOLD_MS } }}
					renderOutside={({ points: chartPoints, chartBounds, xScale, yScale }) => (
						<>
							{/*시간 기준선*/}
							{guidesMs.map((guideMs) => {
								const guideLabel = formatDuration(guideMs, locale);
								const guideY = yScale(guideMs);

								return (
									<Group key={guideMs}>
										<SkiaLine
											p1={vec(chartBounds.left, guideY)}
											p2={vec(chartBounds.right, guideY)}
											color={colors.border}
											strokeWidth={2}
											strokeCap="round"
										>
											<DashPathEffect intervals={[2, 6]} />
										</SkiaLine>
										{guideFont && (
											<SkiaText
												x={chartBounds.right - guideFont.measureText(guideLabel).width}
												y={guideY - 5}
												text={guideLabel}
												font={guideFont}
												color={colors.muted}
											/>
										)}
									</Group>
								);
							})}
							<SkiaLine
								p1={vec(chartBounds.left, chartBounds.bottom)}
								p2={vec(chartBounds.right, chartBounds.bottom)}
								color={colors.border}
								strokeWidth={2}
							/>

							<Line points={chartPoints.previous} color={colors.subtle} strokeWidth={4} strokeCap="round">
								<DashPathEffect intervals={[0.1, 9]} />
							</Line>
							<Line
								points={chartPoints.current}
								color={colors.orange}
								strokeWidth={5}
								strokeCap="round"
								strokeJoin="round"
								end={lineProgress}
							/>

							{/*훑지 않을 때는 선 끝의 점, 훑을 때는 세로 막대와 두 선 위의 점*/}
							{scrubIndex === null ? (
								<EdgedDot
									x={xScale(lastIndex)}
									y={yScale(currentTotalsMs[lastIndex])}
									radius={7}
									color={colors.orange}
									opacity={lineProgress}
								/>
							) : (
								<Group>
									<SkiaLine
										p1={vec(xScale(scrubIndex), 0)}
										p2={vec(xScale(scrubIndex), chartBounds.bottom)}
										color={colors.text}
										strokeWidth={3}
										strokeCap="round"
									/>
									<EdgedDot
										x={xScale(scrubIndex)}
										y={yScale(previousTotalsMs[Math.min(scrubIndex, previousTotalsMs.length - 1)])}
										radius={6}
										color={colors.subtle}
									/>
									<EdgedDot
										x={xScale(scrubIndex)}
										y={yScale(currentTotalsMs[scrubIndex])}
										radius={7}
										color={colors.orange}
									/>
								</Group>
							)}
						</>
					)}
				>
					{({ points: chartPoints, chartBounds }) => (
						<Area points={chartPoints.current} y0={chartBounds.bottom} color={colors.orangePale} />
					)}
				</CartesianChart>

				{/*훑고 있는 구간의 학습 시간*/}
				{tooltip && (
					<View
						pointerEvents="none"
						style={[styles.tooltip, { left: tooltipLeft }]}
						onLayout={(event) => setTooltipWidth(event.nativeEvent.layout.width)}
					>
						<Copy style={styles.tooltipTitle}>{tooltip.title}</Copy>
						<Copy style={styles.tooltipDetail}>{tooltip.detail}</Copy>
					</View>
				)}
			</View>

			{/*x축 라벨*/}
			<View style={styles.axisRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				{trend.map((bucket) => (
					<View key={bucket.start} style={styles.axisCell}>
						<Copy numberOfLines={1} style={styles.axisText}>
							{formatAxisLabel(period, dayjs(bucket.start), t)}
						</Copy>
					</View>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	chartContainer: { height: CHART_HEIGHT, marginTop: 14 },
	tooltip: {
		position: 'absolute',
		top: 0,
		paddingTop: 5,
		paddingBottom: 6,
		paddingHorizontal: 10,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 12,
		backgroundColor: colors.background,
	},
	tooltipTitle: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16 },
	tooltipDetail: { fontFamily: font.black, fontSize: 13, lineHeight: 17, fontVariant: ['tabular-nums'] },
	axisRow: {
		flexDirection: 'row',
		marginTop: 6,
		paddingLeft: CHART_PADDING.left,
		paddingRight: CHART_PADDING.right,
	},
	axisCell: { flex: 1, minWidth: 0, alignItems: 'center' },
	axisText: {
		width: 36,
		textAlign: 'center',
		fontFamily: font.extraBold,
		fontSize: 11,
		lineHeight: 16,
		color: colors.muted,
	},
});

export default CumulativeChart;
