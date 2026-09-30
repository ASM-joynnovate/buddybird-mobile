import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, {
	Easing,
	type MeasuredDimensions,
	measure,
	useAnimatedRef,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import CountUpText, { type CountUnit } from '@/screens/session/components/count-up-text';
import { bumpScale, burstEasing, glintSweep } from '@/screens/session/components/summary-animations';
import { type SummaryMetric, summaryMetricColors } from '@/screens/session/components/summary-colors';
import SummaryGlint from '@/screens/session/components/summary-glint';
import { colors, font } from '@/theme';
import { SECOND } from '@/utils/units';

const FILL_MS = 1.1 * SECOND;
const SPARK_MS = 600;
const SPARK_FADE_DELAY_MS = 420;
const SPARK_FADE_MS = 180;

export interface SummarySentence {
	lead: string;
	tail: string;
	value: number;
	unit: CountUnit;
	metric: SummaryMetric;
}

interface Props {
	sentence: SummarySentence;
	size: 'medium' | 'large';
	filled: boolean;
	onFilled: (position: MeasuredDimensions | null) => void;
}

/**
 * 숫자가 올라가는 동안 배경이 차오르는 숫자 컴포넌트
 * @param sentence 숫자를 담은 문장
 * @param size 글자 크기
 * @param filled 처음부터 다 찬 상태로 보일지 여부
 * @param onFilled 배경이 다 차면 숫자의 화면 위치를 받아 실행할 함수
 */
const SummarySpeechFillingNumber = ({ sentence, size, filled, onFilled }: Props) => {
	const reducedMotion = useReducedMotion();

	const pillRef = useAnimatedRef<Animated.View>();
	const progress = useSharedValue(filled || reducedMotion ? 1 : 0);
	const bump = useSharedValue(1);
	const glint = useSharedValue(0);
	const spark = useSharedValue(0);
	const sparkOpacity = useSharedValue(1);

	const [pillWidth, setPillWidth] = useState(0);

	const palette = summaryMetricColors[sentence.metric];
	const pillSizeStyle = size === 'large' ? styles.pillLarge : styles.pillMedium;
	const textSizeStyle = size === 'large' ? styles.textLarge : styles.textMedium;
	const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.get() }] }));
	const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));
	const onFillClipStyle = useAnimatedStyle(() => ({
		opacity: pillWidth === 0 ? 0 : 1,
		transform: [{ translateX: -(1 - progress.get()) * pillWidth }],
	}));
	const onFillTextStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: (1 - progress.get()) * pillWidth }],
	}));
	const sparksStyle = useAnimatedStyle(() => ({ opacity: sparkOpacity.get(), transform: [{ scale: spark.get() }] }));

	/** 아직 다 차지 않은 문장이면 숫자 배경 채우기 시작 */
	useEffect(() => {
		if (filled) {
			return;
		}

		if (reducedMotion) {
			onFilled(null);

			return;
		}

		progress.set(
			withTiming(1, { duration: FILL_MS, easing: Easing.out(Easing.exp) }, (finished) => {
				if (!finished) {
					return;
				}

				const position = measure(pillRef);

				bump.set(bumpScale());
				glint.set(glintSweep());
				spark.set(withTiming(1, { duration: SPARK_MS, easing: burstEasing }));
				sparkOpacity.set(
					withDelay(SPARK_FADE_DELAY_MS, withTiming(0, { duration: SPARK_FADE_MS, easing: burstEasing })),
				);
				scheduleOnRN(onFilled, position);
			}),
		);
	}, [bump, filled, glint, onFilled, pillRef, progress, reducedMotion, spark, sparkOpacity]);

	return (
		<Animated.View style={[styles.container, bumpStyle]}>
			<Animated.View
				ref={pillRef}
				style={[styles.pillContainer, pillSizeStyle]}
				onLayout={(event) => setPillWidth(event.nativeEvent.layout.width)}
			>
				<View style={[styles.trackBorder, pillSizeStyle]} />

				{/*차오르는 면*/}
				<Animated.View
					style={[styles.fill, { backgroundColor: palette.face, borderBottomColor: palette.edge }, fillStyle]}
				>
					<View style={styles.highlight} />
				</Animated.View>

				<CountUpText
					progress={progress}
					from={0}
					to={sentence.value}
					unit={sentence.unit}
					style={[styles.text, textSizeStyle]}
				/>

				{/*면이 지나간 자리의 흰 글자*/}
				<Animated.View
					style={[styles.onFillClip, onFillClipStyle]}
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
				>
					<Animated.View style={[pillSizeStyle, onFillTextStyle]}>
						<CountUpText
							progress={progress}
							from={0}
							to={sentence.value}
							unit={sentence.unit}
							style={[styles.text, styles.textOnFill, textSizeStyle]}
						/>
					</Animated.View>
				</Animated.View>

				<SummaryGlint progress={glint} width={pillWidth} />
			</Animated.View>

			{/*다 차면 튀는 조각*/}
			<Animated.View pointerEvents="none" style={[styles.sparksContainer, sparksStyle]}>
				<View style={[styles.spark, styles.sparkYellow, styles.sparkTop]} />
				<View style={[styles.spark, styles.sparkOrange, styles.sparkMiddle]} />
				<View style={[styles.spark, styles.sparkYellow, styles.sparkBottom]} />
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { alignSelf: 'center' },
	pillContainer: { overflow: 'hidden', backgroundColor: colors.surface },
	pillLarge: { borderRadius: 12, paddingHorizontal: 12, paddingBottom: 4 },
	pillMedium: { borderRadius: 8, paddingHorizontal: 8, paddingBottom: 4 },
	trackBorder: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		borderWidth: 2,
		borderColor: colors.border,
	},
	fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderBottomWidth: 4, transformOrigin: 'left' },
	highlight: {
		position: 'absolute',
		top: 4,
		right: 8,
		left: 8,
		height: 4,
		borderRadius: 4,
		backgroundColor: colors.onFilled,
		opacity: 0.3,
	},
	onFillClip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
	text: { fontFamily: font.black, color: colors.subtle, textAlign: 'center', fontVariant: ['tabular-nums'] },
	textOnFill: { color: colors.onFilled },
	textLarge: { fontSize: 28, lineHeight: 44 },
	textMedium: { fontSize: 22, lineHeight: 36 },
	sparksContainer: { position: 'absolute', top: '50%', right: -20, width: 48, height: 48, marginTop: -24 },
	spark: {
		position: 'absolute',
		width: 8,
		height: 8,
		borderRadius: 2,
		borderBottomWidth: 2,
		transform: [{ rotate: '45deg' }],
	},
	sparkYellow: { backgroundColor: colors.yellow, borderBottomColor: colors.yellowDark },
	sparkOrange: { backgroundColor: colors.orange, borderBottomColor: colors.orangeDark },
	sparkTop: { top: 4, left: 36 },
	sparkMiddle: { top: 20, left: 44 },
	sparkBottom: { top: 36, left: 36 },
});

export default SummarySpeechFillingNumber;
