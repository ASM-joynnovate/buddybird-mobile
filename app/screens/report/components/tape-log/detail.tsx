import { useEffect, useRef } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { ShareIcon } from 'lucide-react-native';
import Animated, {
	interpolateColor,
	Keyframe,
	LayoutAnimationConfig,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

import DashedLine from '@/screens/report/components/dashed-line';
import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import type { TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';

const METER_BAR_COUNT = 10;
const METER_MS = 140;
const METER_STAGGER_MS = 20;
const METER_OPEN_DELAY_MS = 100;
const ARRIVE_MS = 220;
const ARRIVE_DISTANCE = 6;
const PERCENT = 100;
const PERCENT_PER_BAR = 10;

const scoreColors = {
	parrot: { meter: colors.blue, value: colors.blueMedium },
	mimic: { meter: colors.purple, value: colors.purpleMedium },
};

/** 아래에서 살짝 떠오르며 나타나는 애니메이션 */
const arriveIn = new Keyframe({
	0: { opacity: 0, transform: [{ translateY: ARRIVE_DISTANCE }] },
	100: { opacity: 1, transform: [{ translateY: 0 }], easing: burstEasing },
}).duration(ARRIVE_MS);

/** 흐려졌다가 나타나는 애니메이션 */
const fadeIn = new Keyframe({ 0: { opacity: 0 }, 100: { opacity: 1 } })
	.duration(ARRIVE_MS)
	.reduceMotion(ReduceMotion.Never);

interface MeterBarProps {
	lit: boolean;
	order: number;
	color: string;
	instant: boolean;
}

/**
 * 점수 막대의 한 칸 컴포넌트
 * @param lit 켜졌는지 여부
 * @param order 막대 안에서의 순서
 * @param color 켜졌을 때의 색
 * @param instant 움직임 없이 바로 보일지 여부
 */
const MeterBar = ({ lit, order, color, instant }: MeterBarProps) => {
	const reducedMotion = useReducedMotion();

	const level = useSharedValue(instant && lit ? 1 : 0);

	const firstRunRef = useRef(true);

	const barStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(level.get(), [0, 1], [colors.whiteFaint, color]),
	}));

	/** 왼쪽부터 차례로 막대를 켬 */
	useEffect(() => {
		const openDelay = firstRunRef.current && !instant ? METER_OPEN_DELAY_MS : 0;

		firstRunRef.current = false;

		if (reducedMotion) {
			level.set(lit ? 1 : 0);

			return;
		}

		level.set(
			lit
				? withDelay(
						openDelay + order * METER_STAGGER_MS,
						withTiming(1, { duration: METER_MS, easing: burstEasing }),
					)
				: withTiming(0, { duration: METER_MS, easing: burstEasing }),
		);
	}, [instant, level, lit, order, reducedMotion]);

	return <Animated.View style={[styles.meterBar, barStyle]} />;
};

interface Props {
	item: TapeItem;
	playing: boolean;
	wordName: string;
	instant: boolean;
	onTogglePlay: () => void;
	onShare: (item: TapeItem) => void;
}

/**
 * 선택한 알약의 상세 패널 컴포넌트
 * @param item 선택한 알약
 * @param playing 재생 중 여부
 * @param wordName 세션에서 학습한 단어
 * @param instant 움직임 없이 바로 보일지 여부
 * @param onTogglePlay 재생 버튼을 누르면 실행할 함수
 * @param onShare 공유 버튼을 누르면 실행할 함수
 */
const TapeLogDetail = ({ item, playing, wordName, instant, onTogglePlay, onShare }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const itemName = joinLabel(t(`report.detail.kinds.${item.kind}`), dayjs(item.startedAt).format('LT'));
	const startTime = dayjs(item.startedAt).format('h:mm:ss');
	const timeText =
		item.kind === 'emergency' && item.endedAt
			? t('report.detail.timeRange', { start: startTime, end: dayjs(item.endedAt).format('h:mm:ss') })
			: startTime;
	const percent = item.score === null ? null : Math.round(item.score * PERCENT);
	const scoreLabel =
		item.kind === 'mimic' ? t('report.detail.scores.mimic', { word: wordName }) : t('report.detail.scores.parrot');
	const scoreColor = item.kind === 'emergency' ? null : scoreColors[item.kind];
	const arriveAnimation = reducedMotion ? fadeIn : arriveIn;

	return (
		<View style={styles.detail}>
			<LayoutAnimationConfig skipEntering>
				<View style={styles.main}>
					<Animated.View key={item.id} entering={arriveAnimation}>
						<Copy style={styles.time}>{timeText}</Copy>
					</Animated.View>

					<View style={styles.actions}>
						{item.kind !== 'emergency' && (
							<Animated.View entering={arriveAnimation}>
								<IconButton
									icon={ShareIcon}
									iconProps={{ size: 17, strokeWidth: 2.5 }}
									label={t('report.detail.share', { name: itemName })}
									variant="onDark"
									size="compact"
									onPress={() => onShare(item)}
								/>
							</Animated.View>
						)}

						<PlayButton
							playing={playing}
							label={
								playing
									? t('common.sound.stopNamed', { name: itemName })
									: t('report.detail.play', { name: itemName })
							}
							size="compact"
							disabled={item.sounds.length === 0}
							onPress={onTogglePlay}
						/>
					</View>
				</View>

				{scoreColor && percent !== null && (
					<Animated.View entering={arriveAnimation} style={styles.score}>
						<DashedLine color={colors.whiteFaint} />

						<View
							accessible
							accessibilityLabel={joinLabel(scoreLabel, t('report.detail.percent', { value: percent }))}
							style={styles.scoreRow}
						>
							<Copy numberOfLines={1} style={styles.scoreLabel}>
								{scoreLabel}
							</Copy>

							<View style={styles.meter}>
								{Array.from({ length: METER_BAR_COUNT }, (_, order) => (
									<MeterBar
										key={order}
										lit={order < Math.round(percent / PERCENT_PER_BAR)}
										order={order}
										color={scoreColor.meter}
										instant={instant}
									/>
								))}
							</View>

							<Animated.View key={item.id} entering={arriveAnimation}>
								<Copy style={[styles.scoreValue, { color: scoreColor.value }]}>
									{t('report.detail.percent', { value: percent })}
								</Copy>
							</Animated.View>
						</View>
					</Animated.View>
				)}
			</LayoutAnimationConfig>
		</View>
	);
};

const styles = StyleSheet.create({
	detail: {
		paddingTop: 8,
		paddingRight: 8,
		paddingBottom: 10,
		paddingLeft: 14,
		borderRadius: 14,
		backgroundColor: colors.text,
	},
	main: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
	time: {
		fontFamily: font.black,
		fontSize: 16,
		lineHeight: 20,
		color: colors.onFilled,
		fontVariant: ['tabular-nums'],
	},
	actions: { flexDirection: 'row', gap: 8 },
	score: { marginTop: 8 },
	scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 },
	scoreLabel: {
		flex: 1,
		minWidth: 0,
		fontFamily: font.extraBold,
		fontSize: 12,
		lineHeight: 16,
		color: colors.whiteMuted,
	},
	meter: { flexDirection: 'row', gap: 2 },
	meterBar: { width: 4, height: 10, borderRadius: 1 },
	scoreValue: {
		minWidth: 32,
		fontFamily: font.black,
		fontSize: 13,
		lineHeight: 16,
		textAlign: 'right',
		fontVariant: ['tabular-nums'],
	},
});

export default TapeLogDetail;
