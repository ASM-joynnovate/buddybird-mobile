import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	clamp,
	FadeIn,
	FadeOut,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PETCAM_MAX_ZOOM, PETCAM_ZOOM_HINT_MS } from '@/config/policy';
import { SECOND } from '@/config/units';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { Copy } from '@/components/ui/copy';

const ZOOM_LABEL_MS = SECOND;

/** 이동 거리 제한 함수 */
const clampOffset = (offset: number, scale: number, viewSize: number, contentSize: number) => {
	'worklet';

	const limit = Math.max(0, (contentSize * scale - viewSize) / 2);

	return Math.min(limit, Math.max(-limit, offset));
};

/** 기준점을 유지하는 확대 위치 계산 함수 */
const zoomOffset = (offset: number, focus: number, ratio: number) => {
	'worklet';

	return focus - (focus - offset) * ratio;
};

/** 화면에 맞춘 내용 크기 계산 함수 */
const fitContentSize = (viewWidth: number, viewHeight: number, aspectRatio: number | null) => {
	'worklet';

	if (!aspectRatio) {
		return { width: viewWidth, height: viewHeight };
	}

	const width = Math.min(viewWidth, viewHeight * aspectRatio);

	return { width, height: width / aspectRatio };
};

interface Props {
	children: ReactNode;
	contentAspectRatio: number | null;
	onTap: () => void;
}

/**
 * 확대할 수 있는 영상 컴포넌트
 * @param children 확대할 내용
 * @param contentAspectRatio 화면에 맞춰 표시한 내용의 가로세로 비율
 * @param onTap 화면을 누를 때 실행할 함수
 */
const ZoomableView = ({ children, contentAspectRatio, onTap }: Props) => {
	const { t } = useTranslation();

	const [hintVisible, setHintVisible] = useState(true);
	const [zoom, setZoom] = useState<number | null>(null);

	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const offsetX = useSharedValue(0);
	const offsetY = useSharedValue(0);
	const savedOffsetX = useSharedValue(0);
	const savedOffsetY = useSharedValue(0);
	const pointerCount = useSharedValue(0);

	const contentStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }, { scale: scale.get() }],
	}));

	/** 확대 방법 안내 숨김 함수 */
	const hideHint = useCallback(() => setHintVisible(false), []);

	const gesture = useMemo(() => {
		const pinch = Gesture.Pinch()
			.onStart(() => {
				scheduleOnRN(hideHint);
			})
			.onUpdate((event) => {
				const nextScale = clamp(savedScale.get() * event.scale, 1, PETCAM_MAX_ZOOM);
				const scaleRatio = nextScale / scale.get();
				const contentSize = fitContentSize(width.get(), height.get(), contentAspectRatio);
				const focusX = event.focalX - width.get() / 2;
				const focusY = event.focalY - height.get() / 2;
				const nextOffsetX = clampOffset(
					zoomOffset(offsetX.get(), focusX, scaleRatio),
					nextScale,
					width.get(),
					contentSize.width,
				);
				const nextOffsetY = clampOffset(
					zoomOffset(offsetY.get(), focusY, scaleRatio),
					nextScale,
					height.get(),
					contentSize.height,
				);

				// 손가락 사이 지점 기준 확대를 이동 기준 위치에 반영
				savedOffsetX.set(savedOffsetX.get() + nextOffsetX - offsetX.get());
				savedOffsetY.set(savedOffsetY.get() + nextOffsetY - offsetY.get());

				scale.set(nextScale);
				offsetX.set(nextOffsetX);
				offsetY.set(nextOffsetY);
			})
			.onEnd(() => {
				savedScale.set(scale.get());
				savedOffsetX.set(offsetX.get());
				savedOffsetY.set(offsetY.get());
			});

		const pan = Gesture.Pan()
			.averageTouches(true)
			.onUpdate((event) => {
				// 손가락 수 변경 시 기준 위치 갱신
				if (event.numberOfPointers !== pointerCount.get()) {
					pointerCount.set(event.numberOfPointers);
					savedOffsetX.set(offsetX.get() - event.translationX);
					savedOffsetY.set(offsetY.get() - event.translationY);
				}

				const contentSize = fitContentSize(width.get(), height.get(), contentAspectRatio);

				offsetX.set(
					clampOffset(savedOffsetX.get() + event.translationX, scale.get(), width.get(), contentSize.width),
				);
				offsetY.set(
					clampOffset(savedOffsetY.get() + event.translationY, scale.get(), height.get(), contentSize.height),
				);
			})
			.onEnd(() => {
				pointerCount.set(0);
				savedOffsetX.set(offsetX.get());
				savedOffsetY.set(offsetY.get());
			});

		// 두 번 누르면 배율 초기화
		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.onEnd(() => {
				scale.set(withTiming(1));
				offsetX.set(withTiming(0));
				offsetY.set(withTiming(0));
				savedScale.set(1);
				savedOffsetX.set(0);
				savedOffsetY.set(0);
			});

		const tap = Gesture.Tap().onEnd(() => {
			scheduleOnRN(onTap);
		});

		return Gesture.Simultaneous(pinch, pan, doubleTap, tap);
	}, [
		contentAspectRatio,
		height,
		hideHint,
		onTap,
		offsetX,
		offsetY,
		pointerCount,
		savedOffsetX,
		savedOffsetY,
		savedScale,
		scale,
		width,
	]);

	/** 화면 크기 및 영상 비율 변경 시 이동 위치 재조정 */
	useAnimatedReaction(
		() => fitContentSize(width.get(), height.get(), contentAspectRatio),
		(contentSize) => {
			offsetX.set(clampOffset(offsetX.get(), scale.get(), width.get(), contentSize.width));
			offsetY.set(clampOffset(offsetY.get(), scale.get(), height.get(), contentSize.height));
			savedOffsetX.set(offsetX.get());
			savedOffsetY.set(offsetY.get());
		},
		[contentAspectRatio],
	);

	/** 배율 변경 시 현재 배율 표시 */
	useAnimatedReaction(
		() => Math.round(scale.get() * 10) / 10,
		(current, previous) => {
			if (previous !== null && current !== previous) {
				scheduleOnRN(setZoom, current);
			}
		},
	);

	/** 확대 방법 안내는 잠시 뒤 숨김 */
	useEffect(() => {
		const timer = setTimeout(hideHint, PETCAM_ZOOM_HINT_MS);

		return () => clearTimeout(timer);
	}, [hideHint]);

	/** 배율 표시를 잠시 뒤 숨김 */
	useEffect(() => {
		if (zoom === null) {
			return;
		}

		const timer = setTimeout(() => setZoom(null), ZOOM_LABEL_MS);

		return () => clearTimeout(timer);
	}, [zoom]);

	const handleSaveSize = (event: LayoutChangeEvent) => {
		width.set(event.nativeEvent.layout.width);
		height.set(event.nativeEvent.layout.height);
	};

	return (
		<View style={StyleSheet.absoluteFill}>
			<GestureDetector gesture={gesture}>
				<View style={styles.fill} onLayout={handleSaveSize} collapsable={false}>
					<Animated.View style={[styles.fill, contentStyle]}>{children}</Animated.View>
				</View>
			</GestureDetector>

			{zoom !== null && (
				<Animated.View entering={FadeIn} exiting={FadeOut} style={styles.zoomLabel} pointerEvents="none">
					<Copy style={styles.zoomText}>
						{t('session.watch.zoomLevel', {
							zoom,
							formatParams: { zoom: { minimumFractionDigits: 1, maximumFractionDigits: 1 } },
						})}
					</Copy>
				</Animated.View>
			)}

			{hintVisible && (
				<Animated.View entering={FadeIn} exiting={FadeOut} style={styles.hint} pointerEvents="none">
					<Copy style={styles.hintTitle}>{t('session.watch.zoomHint.title')}</Copy>
					<Copy style={styles.hintMessage}>{t('session.watch.zoomHint.message')}</Copy>
				</Animated.View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	fill: { flex: 1 },
	zoomLabel: {
		position: 'absolute',
		top: '16%',
		alignSelf: 'center',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 999,
		backgroundColor: sessionColors.overlay,
	},
	zoomText: { fontFamily: font.black, fontSize: 14, color: sessionColors.overlayText, fontVariant: ['tabular-nums'] },
	hint: {
		position: 'absolute',
		top: '22%',
		left: 48,
		right: 48,
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 18,
		backgroundColor: sessionColors.overlay,
	},
	hintTitle: { fontFamily: font.extraBold, fontSize: 15, color: sessionColors.overlayText, textAlign: 'center' },
	hintMessage: { fontFamily: font.bold, fontSize: 13, color: sessionColors.text, textAlign: 'center' },
});

export default ZoomableView;
