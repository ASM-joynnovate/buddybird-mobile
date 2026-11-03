import { type ReactNode, useEffect, useState } from 'react';

import { type LayoutRectangle, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Canvas, FillType, Path, Skia, usePathValue } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ReportGuideTouchHint from '@/screens/report/components/report-guide/touch-hint';
import { colors } from '@/theme';

import { MASCOT_FOOT_Y, MASCOT_SIZE } from '@/components/buddy-refresh/constants';
import { Button } from '@/components/ui/button';

const HIGHLIGHT_PADDING = 10;
const HIGHLIGHT_MOVE_MS = 300;
const SIGN_GAP = 12;

interface Props {
	target: LayoutRectangle | null;
	targetRadius: number;
	targetTappable: boolean;
	children: ReactNode;
	onSkip: () => void;
}

/**
 * 강조 영역 밖을 어둡게 표시하는 컴포넌트
 * @param target 강조 영역
 * @param targetRadius 강조 영역 모서리 반지름
 * @param targetTappable 강조 영역을 누를 수 있는지 여부
 * @param children 안내 팻말
 * @param onSkip 건너뛰기를 누르면 실행할 함수
 */
const ReportGuideCoachMark = ({ target, targetRadius, targetTappable, children, onSkip }: Props) => {
	const { t } = useTranslation();
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const [signHeight, setSignHeight] = useState(0);
	const [skipBottom, setSkipBottom] = useState(insets.top);

	const highlightX = useSharedValue(0);
	const highlightY = useSharedValue(0);
	const highlightWidth = useSharedValue(width);
	const highlightHeight = useSharedValue(height);
	const highlightRadius = useSharedValue(0);
	const scrimOpacity = useSharedValue(0);

	const scrimPath = usePathValue((builder) => {
		'worklet';

		builder
			.addRect(Skia.XYWHRect(0, 0, width, height))
			.addRRect(
				Skia.RRectXY(
					Skia.XYWHRect(highlightX.get(), highlightY.get(), highlightWidth.get(), highlightHeight.get()),
					highlightRadius.get(),
					highlightRadius.get(),
				),
			)
			.setFillType(FillType.EvenOdd);
	});
	const topBlockerStyle = useAnimatedStyle(() => ({ height: highlightY.get() }));
	const bottomBlockerStyle = useAnimatedStyle(() => ({ top: highlightY.get() + highlightHeight.get() }));
	const leftBlockerStyle = useAnimatedStyle(() => ({
		top: highlightY.get(),
		width: highlightX.get(),
		height: highlightHeight.get(),
	}));
	const rightBlockerStyle = useAnimatedStyle(() => ({
		top: highlightY.get(),
		left: highlightX.get() + highlightWidth.get(),
		height: highlightHeight.get(),
	}));

	const signAbove = !!target && target.y - HIGHLIGHT_PADDING - SIGN_GAP - signHeight - MASCOT_SIZE >= skipBottom;

	/** 강조 영역 변경 시 강조 위치 이동 */
	useEffect(() => {
		scrimOpacity.set(withTiming(target ? 1 : 0, { duration: HIGHLIGHT_MOVE_MS }));

		if (!target) {
			return;
		}

		highlightX.set(withTiming(target.x - HIGHLIGHT_PADDING, { duration: HIGHLIGHT_MOVE_MS }));
		highlightY.set(withTiming(target.y - HIGHLIGHT_PADDING, { duration: HIGHLIGHT_MOVE_MS }));
		highlightWidth.set(withTiming(target.width + HIGHLIGHT_PADDING * 2, { duration: HIGHLIGHT_MOVE_MS }));
		highlightHeight.set(withTiming(target.height + HIGHLIGHT_PADDING * 2, { duration: HIGHLIGHT_MOVE_MS }));
		highlightRadius.set(withTiming(targetRadius + HIGHLIGHT_PADDING, { duration: HIGHLIGHT_MOVE_MS }));
	}, [highlightHeight, highlightRadius, highlightWidth, highlightX, highlightY, scrimOpacity, target, targetRadius]);

	return (
		<View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
			<Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
				<Path path={scrimPath} color={colors.backdrop} opacity={scrimOpacity} />
			</Canvas>

			{/*강조 영역 밖의 터치 차단*/}
			<Animated.View onStartShouldSetResponder={() => true} style={[styles.topBlocker, topBlockerStyle]} />
			<Animated.View onStartShouldSetResponder={() => true} style={[styles.bottomBlocker, bottomBlockerStyle]} />
			<Animated.View onStartShouldSetResponder={() => true} style={[styles.leftBlocker, leftBlockerStyle]} />
			<Animated.View onStartShouldSetResponder={() => true} style={[styles.rightBlocker, rightBlockerStyle]} />
			{(!target || !targetTappable) && (
				<View onStartShouldSetResponder={() => true} style={StyleSheet.absoluteFill} />
			)}

			{target && targetTappable && <ReportGuideTouchHint target={target} />}

			{target && (
				<View
					pointerEvents="box-none"
					style={[
						styles.signContainer,
						signAbove
							? { bottom: height - target.y + HIGHLIGHT_PADDING + SIGN_GAP }
							: [styles.signBelow, { top: target.y + target.height + HIGHLIGHT_PADDING }],
					]}
				>
					<View
						pointerEvents="box-none"
						onLayout={(event) => setSignHeight(event.nativeEvent.layout.height)}
						style={styles.sign}
					>
						{children}
					</View>
				</View>
			)}

			<View
				onLayout={(event) => setSkipBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)}
				style={[styles.skip, { top: insets.top + 8 }]}
			>
				<Button label={t('common.skip')} variant="secondary" size="small" onPress={onSkip} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	topBlocker: { position: 'absolute', top: 0, right: 0, left: 0 },
	bottomBlocker: { position: 'absolute', right: 0, bottom: 0, left: 0 },
	leftBlocker: { position: 'absolute', left: 0 },
	rightBlocker: { position: 'absolute', right: 0 },
	signContainer: { position: 'absolute', right: 0, left: 0, alignItems: 'center', paddingHorizontal: 16 },
	sign: { maxWidth: '100%' },
	signBelow: { overflow: 'hidden', paddingTop: SIGN_GAP + MASCOT_FOOT_Y },
	skip: { position: 'absolute', left: 24 },
});

export default ReportGuideCoachMark;
