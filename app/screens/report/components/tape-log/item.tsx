import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import Animated, {
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

import LevelBar from '@/screens/report/components/level-bar';
import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { soundKindColors } from '@/screens/report/components/sound-kind-colors';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import type { TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const PILL_BORDER = 2;
const HIT_SLOP = 4;
const RISE_DISTANCE = 8;
const RISE_MS = 320;
const RISE_DELAY_MS = 100;
const RISE_STAGGER_MS = 45;
const RISE_STAGGER_LIMIT = 6;
const FILL_MS = 260;
const FADE_MS = 150;
const BAR_MS = 420;
const BAR_STAGGER_MS = 140;
const BAR_COUNT = 3;

interface Props {
	item: TapeItem;
	order: number;
	selected: boolean;
	playing: boolean;
	rowRevealed: SharedValue<boolean>;
	onPress: (item: TapeItem) => void;
}

/**
 * 테이프 기록의 소리 알약 컴포넌트
 * @param item 알약에 담긴 소리
 * @param order 행 안에서의 순서
 * @param selected 선택한 알약인지 여부
 * @param playing 재생 중 여부
 * @param rowRevealed 행이 화면에 나타났는지 여부
 * @param onPress 누르면 실행할 함수
 */
const TapeLogItem = ({ item, order, selected, playing, rowRevealed, onPress }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const rise = useSharedValue(reducedMotion ? 1 : 0);
	const fill = useSharedValue(selected ? 1 : 0);
	const fillOpacity = useSharedValue(selected ? 1 : 0);

	const [pillWidth, setPillWidth] = useState(0);

	const palette = soundKindColors[item.kind];
	const time = dayjs(item.startedAt).format('h:mm');
	const riseStyle = useAnimatedStyle(() => ({
		opacity: rise.get(),
		transform: [{ translateY: (1 - rise.get()) * RISE_DISTANCE }],
	}));
	const fillClipStyle = useAnimatedStyle(() => ({
		opacity: fillOpacity.get(),
		transform: [{ translateX: -(1 - fill.get()) * pillWidth }],
	}));
	const fillFaceStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - fill.get()) * pillWidth }] }));

	/** 행이 화면에 나타나면 순서대로 떠오름 */
	useAnimatedReaction(
		() => rowRevealed.get(),
		(shown, previouslyShown) => {
			if (!shown || previouslyShown || reducedMotion) {
				return;
			}

			rise.set(
				withDelay(
					Math.min(order, RISE_STAGGER_LIMIT) * RISE_STAGGER_MS + RISE_DELAY_MS,
					withTiming(1, { duration: RISE_MS, easing: burstEasing }),
				),
			);
		},
	);

	/** 선택에 따라 종류 색을 채우거나 지움 */
	useEffect(() => {
		if (selected) {
			fillOpacity.set(reducedMotion ? withTiming(1, { duration: FADE_MS }) : 1);
			fill.set(reducedMotion ? 1 : withTiming(1, { duration: FILL_MS, easing: burstEasing }));

			return;
		}

		fillOpacity.set(withTiming(0, { duration: FADE_MS, easing: burstEasing }));
		fill.set(reducedMotion ? 1 : withDelay(FADE_MS, withTiming(0, { duration: 0 })));
	}, [fill, fillOpacity, reducedMotion, selected]);

	return (
		<Animated.View style={riseStyle}>
			<PressableSurface
				accessibilityRole="button"
				accessibilityLabel={joinLabel(
					t(`report.detail.kinds.${item.kind}`),
					dayjs(item.startedAt).format('LT'),
				)}
				accessibilityState={{ selected }}
				onPress={() => onPress(item)}
				hitSlop={HIT_SLOP}
				depth="low"
				cornerRadius="pill"
				faceColor={colors.background}
				edgeColor={selected ? palette.edge : palette.line}
				contentStyle={[styles.pill, { borderColor: palette.line }]}
				onLayout={(event) => setPillWidth(event.nativeEvent.layout.width)}
			>
				<Copy style={[styles.time, { color: palette.text }]}>{time}</Copy>

				{/*선택하면 차오르는 종류 색 면*/}
				<Animated.View pointerEvents="none" style={[styles.fillClip, { width: pillWidth }, fillClipStyle]}>
					<Animated.View
						style={[styles.fillFace, { width: pillWidth, backgroundColor: palette.face }, fillFaceStyle]}
					>
						{playing && (
							<View style={styles.bars}>
								{Array.from({ length: BAR_COUNT }, (_, index) => (
									<LevelBar
										key={index}
										playing={playing}
										duration={BAR_MS}
										delay={index * BAR_STAGGER_MS}
										style={styles.bar}
									/>
								))}
							</View>
						)}
						<Copy style={styles.fillTime}>{time}</Copy>
					</Animated.View>
				</Animated.View>
			</PressableSurface>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	pill: { height: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
	time: { fontFamily: font.extraBold, fontSize: 15, fontVariant: ['tabular-nums'] },
	fillClip: {
		position: 'absolute',
		top: -PILL_BORDER,
		bottom: -PILL_BORDER,
		left: -PILL_BORDER,
		overflow: 'hidden',
		borderRadius: radius.pill,
	},
	fillFace: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
		borderRadius: radius.pill,
	},
	fillTime: { fontFamily: font.extraBold, fontSize: 15, color: colors.onFilled, fontVariant: ['tabular-nums'] },
	bars: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 10 },
	bar: { width: 3, height: 10, borderRadius: 1, backgroundColor: colors.onFilled },
});

export default TapeLogItem;
