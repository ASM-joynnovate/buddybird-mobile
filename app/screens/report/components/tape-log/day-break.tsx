import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { formatMonthDayLongWeekday } from '@/i18n/format';

import { CalendarIcon } from 'lucide-react-native';
import Animated, {
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import DashedLine from '@/screens/report/components/dashed-line';
import { PINNED_BAND_HEIGHT } from '@/screens/report/components/recorder/pinned';
import { burstEasing } from '@/screens/report/components/session-detail-animations';
import type { StickyLayout } from '@/screens/report/components/tape-log/strip';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const MARGIN_TOP = 2;
const REVEAL_RATIO = 0.35;
const SLIDE_DISTANCE = 12;
const FADE_MS = 320;
const SLIDE_MS = 420;

interface Props {
	date: number;
	index: number;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logY: SharedValue<number>;
	logHeight: SharedValue<number>;
	stripLayout: SharedValue<StickyLayout>;
	dayBreakLayouts: SharedValue<StickyLayout[]>;
}

/**
 * 가로 테이프 아래에 붙는 날짜 띠 컴포넌트
 * @param date 날짜
 * @param index 테이프 기록 안에서의 날짜 순서
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logY 테이프 기록 위치
 * @param logHeight 테이프 기록 높이
 * @param stripLayout 가로 테이프 위치
 * @param dayBreakLayouts 날짜 띠 위치를 저장할 값
 */
const TapeLogDayBreak = ({
	date,
	index,
	scrollY,
	viewportHeight,
	logY,
	logHeight,
	stripLayout,
	dayBreakLayouts,
}: Props) => {
	const reducedMotion = useReducedMotion();

	const labelOpacity = useSharedValue(reducedMotion ? 1 : 0);
	const labelOffset = useSharedValue(reducedMotion ? 0 : -SLIDE_DISTANCE);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const stickyStyle = useAnimatedStyle(() => {
		const layouts = dayBreakLayouts.get();
		const own = layouts.at(index);

		if (!own) {
			return {};
		}

		const nextTop = layouts.at(index + 1)?.y;
		const end = nextTop === undefined ? logHeight.get() : nextTop - MARGIN_TOP;
		const stickTop = PINNED_BAND_HEIGHT + stripLayout.get().height;
		const translateY = Math.min(
			Math.max(scrollY.get() + stickTop - (logY.get() + own.y), 0),
			Math.max(end - own.y - own.height, 0),
		);

		return { transform: [{ translateY }] };
	});
	const stuckLineStyle = useAnimatedStyle(() => {
		const own = dayBreakLayouts.get().at(index);
		const strip = stripLayout.get();
		const stripStuck = scrollY.get() + PINNED_BAND_HEIGHT >= logY.get() + strip.y;
		const stuck =
			own !== undefined &&
			stripStuck &&
			logY.get() + own.y - scrollY.get() <= PINNED_BAND_HEIGHT + strip.height + 0.5;

		return { opacity: stuck ? 1 : 0 };
	});
	const labelStyle = useAnimatedStyle(() => ({
		opacity: labelOpacity.get(),
		transform: [{ translateX: labelOffset.get() }],
	}));

	/** 날짜 띠가 35% 넘게 보이면 날짜가 밀려 들어옴 */
	useAnimatedReaction(
		() => {
			const own = dayBreakLayouts.get().at(index);

			if (!own || own.height === 0) {
				return false;
			}

			const top = logY.get() + own.y;
			const visibleTop = Math.max(top, scrollY.get());
			const visibleBottom = Math.min(top + own.height, scrollY.get() + viewportHeight.get());

			return (visibleBottom - visibleTop) / own.height >= REVEAL_RATIO;
		},
		(visible, previouslyVisible) => {
			if (!visible || previouslyVisible || reducedMotion || labelOpacity.get() > 0) {
				return;
			}

			labelOpacity.set(withTiming(1, { duration: FADE_MS, easing: burstEasing }));
			labelOffset.set(withTiming(0, { duration: SLIDE_MS, easing: burstEasing }));
		},
	);

	const handleLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		dayBreakLayouts.modify((layouts) => {
			'worklet';

			layouts[index] = { y, height };

			return layouts;
		});
	};

	return (
		<Animated.View style={[styles.dayBreak, stickyStyle]} onLayout={handleLayout}>
			<Animated.View style={[styles.date, labelStyle]}>
				<CalendarIcon size={14} color={colors.onFilled} />
				<Copy accessibilityRole="header" style={styles.dateText}>
					{formatMonthDayLongWeekday(date, locale)}
				</Copy>
			</Animated.View>

			<View style={styles.line}>
				<DashedLine color={colors.border} />
			</View>

			<Animated.View style={[styles.stuckLine, stuckLineStyle]} />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	dayBreak: {
		zIndex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: MARGIN_TOP,
		marginHorizontal: -24,
		paddingVertical: 8,
		paddingHorizontal: 24,
		backgroundColor: colors.background,
	},
	date: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		height: 30,
		paddingRight: 12,
		paddingLeft: 10,
		borderRadius: 10,
		backgroundColor: colors.text,
	},
	dateText: { fontFamily: font.extraBold, fontSize: 13, color: colors.onFilled },
	line: { flex: 1 },
	stuckLine: {
		position: 'absolute',
		right: 0,
		bottom: -2,
		left: 0,
		height: 2,
		backgroundColor: colors.surface,
	},
});

export default TapeLogDayBreak;
