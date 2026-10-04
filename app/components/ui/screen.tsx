import type { ReactNode } from 'react';

import { type ScrollViewProps, StyleSheet, View } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth } from '@/theme';

const KEYBOARD_BOTTOM_OFFSET = 36;

interface Props extends ScrollViewProps {
	scrollable?: boolean;
	footer?: ReactNode;
	children: ReactNode;
}

export const Screen = ({ children, scrollable = true, style, contentContainerStyle, footer, ...props }: Props) => {
	const insets = useSafeAreaInsets();

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, style]}>
			{scrollable ? (
				<KeyboardAwareScrollView
					alwaysBounceVertical={false}
					{...props}
					bottomOffset={KEYBOARD_BOTTOM_OFFSET}
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
				</KeyboardAwareScrollView>
			) : (
				children
			)}

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
