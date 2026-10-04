import { useCallback, useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import CountUpText, { type CountUnit } from '@/screens/session/components/count-up-text';
import { bounceEasing, bumpScale, glintSweep, popIn } from '@/screens/session/components/summary-animations';
import { type SummaryMetric, summaryMetricColors } from '@/screens/session/components/summary-colors';
import SummaryGlint from '@/screens/session/components/summary-glint';
import SummaryStatsFlyingNumber from '@/screens/session/components/summary-stats/flying-number';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useSessionStore } from '@/stores/session';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ADD_DELAY_MS = 300;
const ADD_MS = 700;
const LAND_MS = 450;
const LAND_SCALE = 1.3;

export interface SummaryStat {
	metric: SummaryMetric;
	label: string;
	value: number;
	valueBeforeSession: number | null;
	unit: CountUnit;
	revealAt: number;
}

interface Props {
	stat: SummaryStat;
	revealed: boolean;
}

/**
 * 학습 결과 칩 컴포넌트
 * @param stat 칩에 보여 줄 값
 * @param revealed 해당 문장의 숫자가 다 찼는지 여부
 */
const SummaryStatsItem = ({ stat, revealed }: Props) => {
	const { t } = useTranslation();

	const progress = useSharedValue(0);
	const chipScale = useSharedValue(1);
	const valueScale = useSharedValue(1);
	const glint = useSharedValue(0);

	const [numberLanded, setNumberLanded] = useState(false);
	const [chipWidth, setChipWidth] = useState(0);

	const summarySentenceIndex = useSessionStore((state) => state.summarySentenceIndex);
	const summaryNumberOrigin = useSessionStore((state) => state.summaryNumberOrigin);
	const moveSummarySentence = useSessionStore((state) => state.moveSummarySentence);
	const clearSummaryNumberOrigin = useSessionStore((state) => state.clearSummaryNumberOrigin);
	const locale = useDeviceSettingsStore((state) => state.locale);

	const palette = summaryMetricColors[stat.metric];
	const sentenceShowing = summarySentenceIndex === stat.revealAt;
	const flightOrigin =
		revealed && !numberLanded && summaryNumberOrigin?.sentenceIndex === stat.revealAt
			? summaryNumberOrigin.position
			: null;
	const chipScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: chipScale.get() }] }));
	const valueScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: valueScale.get() }] }));

	if (revealed && !numberLanded && !flightOrigin) {
		setNumberLanded(true);
	}

	/** 숫자가 내려앉으면 칩과 값 강조 */
	useEffect(() => {
		if (!numberLanded) {
			return;
		}

		chipScale.set(bumpScale());
		glint.set(glintSweep());

		if (stat.valueBeforeSession === null) {
			valueScale.set(
				withSequence(
					withTiming(LAND_SCALE, { duration: 0 }),
					withTiming(1, { duration: LAND_MS, easing: bounceEasing }),
				),
			);

			return;
		}

		progress.set(
			withDelay(
				ADD_DELAY_MS,
				withTiming(1, { duration: ADD_MS, easing: Easing.out(Easing.exp) }, (finished) => {
					if (finished) {
						valueScale.set(bumpScale());
					}
				}),
			),
		);
	}, [chipScale, glint, numberLanded, progress, stat.valueBeforeSession, valueScale]);

	const handleLand = useCallback(() => {
		clearSummaryNumberOrigin();

		setNumberLanded(true);
	}, [clearSummaryNumberOrigin]);

	const handleShowSentence = () => {
		if (sentenceShowing) {
			return;
		}

		moveSummarySentence(stat.revealAt);
	};

	return (
		<Animated.View style={[styles.container, chipScaleStyle]}>
			<PressableSurface
				depth="low"
				cornerRadius="control"
				faceColor={sentenceShowing ? palette.pale : undefined}
				edgeColor={sentenceShowing ? palette.face : undefined}
				contentStyle={styles.chip}
				accessibilityState={{ selected: sentenceShowing }}
				onPress={handleShowSentence}
			>
				{/*칩 위를 지나가는 빛줄기*/}
				<View
					pointerEvents="none"
					style={styles.glintContainer}
					onLayout={(event) => setChipWidth(event.nativeEvent.layout.width)}
				>
					<SummaryGlint progress={glint} width={chipWidth} />
				</View>

				<Copy numberOfLines={1} style={styles.label}>
					{stat.label}
				</Copy>

				<Animated.View style={[styles.valueContainer, valueScaleStyle]}>
					<CountUpText
						progress={progress}
						from={stat.valueBeforeSession ?? stat.value}
						to={stat.value}
						unit={stat.unit}
						style={styles.value}
					/>

					{flightOrigin && (
						<SummaryStatsFlyingNumber
							value={stat.value}
							unit={stat.unit}
							metric={stat.metric}
							origin={flightOrigin}
							onLanded={handleLand}
						/>
					)}
				</Animated.View>

				{/*이번 세션이 더한 양*/}
				{numberLanded && stat.valueBeforeSession !== null && (
					<Animated.View entering={popIn()} style={styles.addedBadge}>
						<Copy style={styles.addedText}>
							{t('session.summary.added', {
								duration: formatDuration(stat.value - stat.valueBeforeSession, locale),
							})}
						</Copy>
					</Animated.View>
				)}
			</PressableSurface>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { flexGrow: 1, flexBasis: '40%' },
	chip: { paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
	glintContainer: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		borderRadius: 14,
		overflow: 'hidden',
	},
	label: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.muted },
	valueContainer: { alignSelf: 'flex-start', transformOrigin: 'left' },
	value: { fontFamily: font.black, fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] },
	addedBadge: {
		position: 'absolute',
		top: -8,
		right: 8,
		height: 20,
		justifyContent: 'center',
		paddingHorizontal: 8,
		borderRadius: radius.pill,
		borderWidth: 2,
		borderColor: colors.background,
		backgroundColor: colors.orange,
	},
	addedText: {
		fontFamily: font.extraBold,
		fontSize: 12,
		lineHeight: 16,
		color: colors.onFilled,
		fontVariant: ['tabular-nums'],
	},
});

export default SummaryStatsItem;
