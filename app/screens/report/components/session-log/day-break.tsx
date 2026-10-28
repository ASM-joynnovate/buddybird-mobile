import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import type { StickyLayout } from '@/types/session-log';

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

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { burstEasing, colors, font } from '@/theme';

import DashedLine from '@/components/dashed-line';
import { Copy } from '@/components/ui/copy';

const FIRST_MARGIN_TOP = 4;
const MARGIN_TOP = 24;
const REVEAL_RATIO = 0.35;
const SLIDE_DISTANCE = 12;
const FADE_MS = 320;
const SLIDE_MS = 420;

interface Props {
	date: number;
	dayIndex: number;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logBottom: SharedValue<number>;
	dayBreakLayouts: SharedValue<StickyLayout[]>;
	filterLayout: SharedValue<StickyLayout>;
}

/**
 * 스크롤 시 위에 고정되는 날짜 컴포넌트
 * @param date 날짜
 * @param dayIndex 기록 안에서의 날짜 순서
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logBottom 기록 아래쪽 끝 위치
 * @param dayBreakLayouts 날짜 구분선 위치를 저장할 값
 * @param filterLayout 위에 고정되는 필터 위치
 */
const SessionLogDayBreak = ({
	date,
	dayIndex,
	scrollY,
	viewportHeight,
	logBottom,
	dayBreakLayouts,
	filterLayout,
}: Props) => {
	const motionReduced = useReducedMotion();

	const labelOpacity = useSharedValue(motionReduced ? 1 : 0);
	const labelOffset = useSharedValue(motionReduced ? 0 : -SLIDE_DISTANCE);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const stickyStyle = useAnimatedStyle(() => {
		const layouts = dayBreakLayouts.get();
		const dayBreakLayout = layouts.at(dayIndex);

		if (!dayBreakLayout) {
			return {};
		}

		const nextTop = layouts.at(dayIndex + 1)?.y;
		const end = nextTop === undefined ? logBottom.get() : nextTop - MARGIN_TOP;
		const translateY = Math.min(
			Math.max(scrollY.get() + filterLayout.get().height - dayBreakLayout.y, 0),
			Math.max(end - dayBreakLayout.y - dayBreakLayout.height, 0),
		);

		return { transform: [{ translateY }] };
	});
	const stuckLineStyle = useAnimatedStyle(() => {
		const dayBreakLayout = dayBreakLayouts.get().at(dayIndex);
		const stuck =
			dayBreakLayout !== undefined && dayBreakLayout.y - scrollY.get() - filterLayout.get().height <= 0.5;

		return { opacity: stuck ? 1 : 0 };
	});
	const labelStyle = useAnimatedStyle(() => ({
		opacity: labelOpacity.get(),
		transform: [{ translateX: labelOffset.get() }],
	}));

	/** 일정 비율 넘게 표시되면 날짜 애니메이션 실행 */
	useAnimatedReaction(
		() => {
			const dayBreakLayout = dayBreakLayouts.get().at(dayIndex);

			if (!dayBreakLayout || dayBreakLayout.height === 0) {
				return false;
			}

			const visibleTop = Math.max(dayBreakLayout.y, scrollY.get());
			const visibleBottom = Math.min(
				dayBreakLayout.y + dayBreakLayout.height,
				scrollY.get() + viewportHeight.get(),
			);

			return (visibleBottom - visibleTop) / dayBreakLayout.height >= REVEAL_RATIO;
		},
		(current, previous) => {
			if (!current || previous || motionReduced || labelOpacity.get() > 0) {
				return;
			}

			labelOpacity.set(withTiming(1, { duration: FADE_MS, easing: burstEasing }));
			labelOffset.set(withTiming(0, { duration: SLIDE_MS, easing: burstEasing }));
		},
	);

	const handleSaveLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		dayBreakLayouts.modify((layouts) => {
			'worklet';

			layouts[dayIndex] = { y, height };

			return layouts;
		});
	};

	return (
		<Animated.View
			style={[styles.dayBreak, dayIndex === 0 && styles.firstDayBreak, stickyStyle]}
			onLayout={handleSaveLayout}
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
