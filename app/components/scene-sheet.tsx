import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, { type AnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	title: ReactNode;
	accessory?: ReactNode;
	footer: ReactNode;
	sheetRef?: AnimatedRef<Animated.View>;
	isFullWidth?: boolean;
	children?: ReactNode;
}

/**
 * 장면 아래를 덮는 bottom sheet 컴포넌트
 * @param title 제목
 * @param accessory 제목 위에 놓을 요소
 * @param footer 하단 버튼
 * @param sheetRef bottom sheet 위치 측정에 사용할 ref
 * @param isFullWidth 시트 면을 화면 전체 폭으로 표시할지 여부
 * @param children 제목 아래 내용
 */
const SceneSheet = ({ title, accessory, footer, sheetRef, isFullWidth = false, children }: Props) => {
	const insets = useSafeAreaInsets();

	return (
		<Animated.View
			ref={sheetRef}
			style={[styles.sheet, !isFullWidth && styles.column, { paddingBottom: insets.bottom + 20 }]}
		>
			<View style={styles.content}>
				{accessory}

				<Copy accessibilityRole="header" lineBreakStrategyIOS="hangul-word" style={styles.title}>
					{title}
				</Copy>

				{children}

				<View style={styles.footer}>{footer}</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	sheet: {
		marginTop: -radius.sheet,
		paddingTop: 28,
		paddingHorizontal: 24,
		borderTopLeftRadius: radius.sheet,
		borderTopRightRadius: radius.sheet,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	column: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 12 },
	title: { fontFamily: font.extraBold, fontSize: 20, lineHeight: 28 },
	footer: { marginTop: 12 },
});

export default SceneSheet;
