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

import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import DashedLine from '@/components/dashed-line';
import { Copy } from '@/components/ui/copy';

const FIRST_MARGIN_TOP = 4;
const MARGIN_TOP = 24;
const REVEAL_RATIO = 0.35;
const SLIDE_DISTANCE = 12;
const FADE_MS = 320;
const SLIDE_MS = 420;

export interface StickyLayout {
	y: number;
	height: number;
}

interface Props {
	date: number;
	index: number;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logBottom: SharedValue<number>;
	dayBreakLayouts: SharedValue<StickyLayout[]>;
}

/**
 * 화면 위에 붙는 날짜 띠 컴포넌트
 * @param date 날짜
 * @param index 기록 안에서의 날짜 순서
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logBottom 기록 아래쪽 끝 위치
 * @param dayBreakLayouts 날짜 띠 위치를 저장할 값
 */
const SessionLogDayBreak = ({ date, index, scrollY, viewportHeight, logBottom, dayBreakLayouts }: Props) => {
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
		const end = nextTop === undefined ? logBottom.get() : nextTop - MARGIN_TOP;
		const translateY = Math.min(Math.max(scrollY.get() - own.y, 0), Math.max(end - own.y - own.height, 0));

		return { transform: [{ translateY }] };
	});
	const stuckLineStyle = useAnimatedStyle(() => {
		const own = dayBreakLayouts.get().at(index);
		const stuck = own !== undefined && own.y - scrollY.get() <= 0.5;

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

			const visibleTop = Math.max(own.y, scrollY.get());
			const visibleBottom = Math.min(own.y + own.height, scrollY.get() + viewportHeight.get());

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
		<Animated.View
			style={[styles.dayBreak, index === 0 && styles.firstDayBreak, stickyStyle]}
			onLayout={handleLayout}
		>
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
	firstDayBreak: { marginTop: FIRST_MARGIN_TOP },
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
	dateText: { fontFamily: font.medium, fontSize: 13, color: colors.onFilled },
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

export default SessionLogDayBreak;
