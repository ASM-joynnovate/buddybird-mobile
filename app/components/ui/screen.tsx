import type { ReactNode } from 'react';

import { ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth } from '@/theme';

interface Props extends ScrollViewProps {
	scrollable?: boolean;
	footer?: ReactNode;
	children: ReactNode;
}

export const Screen = ({
	children,
	scrollable = true,
	automaticallyAdjustKeyboardInsets = true,
	style,
	contentContainerStyle,
	footer,
	...props
}: Props) => {
	const insets = useSafeAreaInsets();

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, style]}>
			{/*내용*/}
			{scrollable ? (
				<ScrollView
					alwaysBounceVertical={false}
					{...props}
					automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: footer ? 20 : insets.bottom + 20 },
						contentContainerStyle,
					]}
				>
					{children}
				</ScrollView>
			) : (
				children
			)}

			{/*아래에 고정된 내용*/}
			{!!footer && <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: {
		flexGrow: 1,
		minWidth: 0,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 30,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
	},
	footerContainer: {
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
		gap: 8,
	},
});
