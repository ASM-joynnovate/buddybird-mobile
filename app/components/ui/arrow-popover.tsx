import { type ReactNode, useState } from 'react';

import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ARROW_SIZE = 11;
const ANCHOR_GAP = 14;
const EDGE_GAP = 8;
const ALIGN_OFFSET = 8;

const popoverEntering = new Keyframe({
	0: { opacity: 0, transform: [{ scale: 0.9 }] },
	100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.bezier(0.16, 1, 0.3, 1) },
}).duration(200);

export interface PopoverAnchor {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Props {
	anchor: PopoverAnchor;
	align: 'start' | 'end';
	width: number;
	onClose: () => void;
	children: ReactNode;
}

/**
 * 화살표 팝오버 컴포넌트
 * @param anchor 화면 기준 버튼 위치 및 크기
 * @param align 팝오버를 맞출 버튼의 왼쪽 끝 또는 오른쪽 끝
 * @param width 팝오버 폭
 * @param onClose 팝오버를 닫을 때 실행할 함수
 * @param children 팝오버 내용
 */
export const ArrowPopover = ({ anchor, align, width, onClose, children }: Props) => {
	const { t } = useTranslation();

	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const [contentHeight, setContentHeight] = useState(0);

	const popoverWidth = Math.min(width, windowWidth - EDGE_GAP * 2);
	const preferredLeft =
		align === 'start' ? anchor.x - ALIGN_OFFSET : anchor.x + anchor.width + ALIGN_OFFSET - popoverWidth;
	const left = Math.min(Math.max(preferredLeft, EDGE_GAP), windowWidth - popoverWidth - EDGE_GAP);
	const arrowLeft = Math.min(
		Math.max(anchor.x + anchor.width / 2 - left - ARROW_SIZE, radius.card),
		popoverWidth - radius.card - ARROW_SIZE * 2,
	);
	const belowTop = anchor.y + anchor.height + ANCHOR_GAP;
	const popoverAbove = belowTop + contentHeight > windowHeight - insets.bottom - EDGE_GAP;
	const top = popoverAbove ? anchor.y - ANCHOR_GAP - contentHeight : belowTop;

	return (
		<Modal statusBarTranslucent visible transparent animationType="none" onRequestClose={onClose}>
			<GestureHandlerRootView style={styles.container}>
				<PressableSurface
					accessibilityLabel={t('common.close')}
					onPress={onClose}
					variant="plain"
					depth="none"
					cornerRadius="none"
					style={StyleSheet.absoluteFill}
					contentStyle={styles.backdrop}
				>
					{null}
				</PressableSurface>

				{contentHeight === 0 ? (
					<View
						style={[styles.popover, styles.popoverMeasuring, { width: popoverWidth }]}
						onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
					>
						{children}
					</View>
				) : (
					<Animated.View
						entering={popoverEntering}
						style={[styles.popover, { top, left, width: popoverWidth }]}
					>
						{/*버튼을 가리키는 화살표*/}
						<View
							pointerEvents="none"
							style={[
								styles.arrow,
								popoverAbove ? styles.arrowOuterDown : styles.arrowOuterUp,
								{ left: arrowLeft - 2 },
							]}
						/>
						<View
							pointerEvents="none"
							style={[
								styles.arrow,
								popoverAbove ? styles.arrowInnerDown : styles.arrowInnerUp,
								{ left: arrowLeft - 1 },
							]}
						/>

						{children}
					</Animated.View>
				)}
			</GestureHandlerRootView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	backdrop: { flex: 1, borderWidth: 0 },
	popover: {
		position: 'absolute',
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	popoverMeasuring: { top: 0, left: 0, opacity: 0 },
	arrow: {
		position: 'absolute',
		width: 0,
		height: 0,
		borderLeftColor: colors.backgroundTransparent,
		borderRightColor: colors.backgroundTransparent,
	},
	arrowOuterUp: {
		top: -ARROW_SIZE - 2,
		borderLeftWidth: ARROW_SIZE,
		borderRightWidth: ARROW_SIZE,
		borderBottomWidth: ARROW_SIZE,
		borderBottomColor: colors.border,
	},
	arrowInnerUp: {
		top: -ARROW_SIZE + 1,
		borderLeftWidth: ARROW_SIZE - 1,
		borderRightWidth: ARROW_SIZE - 1,
		borderBottomWidth: ARROW_SIZE - 1,
		borderBottomColor: colors.background,
	},
	arrowOuterDown: {
		bottom: -ARROW_SIZE - 2,
		borderLeftWidth: ARROW_SIZE,
		borderRightWidth: ARROW_SIZE,
		borderTopWidth: ARROW_SIZE,
		borderTopColor: colors.border,
	},
	arrowInnerDown: {
		bottom: -ARROW_SIZE + 1,
		borderLeftWidth: ARROW_SIZE - 1,
		borderRightWidth: ARROW_SIZE - 1,
		borderTopWidth: ARROW_SIZE - 1,
		borderTopColor: colors.background,
	},
});
