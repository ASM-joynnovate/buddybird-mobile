import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	title: ReactNode;
	accessory?: ReactNode;
	footer: ReactNode;
	children?: ReactNode;
}

/**
 * 장면 아래를 덮는 bottom sheet 컴포넌트
 * @param title 제목
 * @param accessory 제목 위에 놓을 요소
 * @param footer 하단 버튼
 * @param children 제목 아래 내용
 */
const SceneSheet = ({ title, accessory, footer, children }: Props) => {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
			<View style={styles.content}>
				{accessory}

				<Copy accessibilityRole="header" lineBreakStrategyIOS="hangul-word" style={styles.title}>
					{title}
				</Copy>

				{children}

				<View style={styles.footer}>{footer}</View>
			</View>
		</View>
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
	content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 12 },
	title: { fontFamily: font.extraBold, fontSize: 20, lineHeight: 28 },
	footer: { marginTop: 12 },
});

export default SceneSheet;
