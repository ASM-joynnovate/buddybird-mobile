import type { PropsWithChildren, ReactNode } from 'react';

import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, radius } from '@/theme';

import { Title } from '@/components/ui/text';

interface Props {
	visible: boolean;
	onClose(): void;
	title: string;
	footer: ReactNode;
}

export function Dialog({ visible, onClose, title, children, footer }: PropsWithChildren<Props>) {
	const insets = useSafeAreaInsets();

	return (
		<Modal statusBarTranslucent visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
				>
					<View accessibilityViewIsModal style={styles.dialog}>
						<Title style={styles.title}>{title}</Title>
						<ScrollView
							style={styles.body}
							keyboardShouldPersistTaps="handled"
							contentContainerStyle={styles.content}
						>
							{children}
						</ScrollView>
						{footer}
					</View>
				</KeyboardAvoidingView>
			</GestureHandlerRootView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.scrim,
		padding: 20,
	},
	dialog: {
		width: '100%',
		maxWidth: contentMaxWidth,
		maxHeight: '100%',
		borderRadius: radius.card,
		paddingHorizontal: 20,
		paddingVertical: 24,
		gap: 20,
		backgroundColor: colors.background,
	},
	body: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
	content: { gap: 12 },
	title: { fontSize: 18, lineHeight: 24 },
});
