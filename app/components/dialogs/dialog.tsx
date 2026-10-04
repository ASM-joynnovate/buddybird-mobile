import type { ReactNode } from 'react';

import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, radius } from '@/theme';

import { Title } from '@/components/ui/title';

interface Props {
	visible: boolean;
	onClose: () => void;
	title: string;
	children?: ReactNode;
	footer: ReactNode;
}

/**
 * 공통 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param onClose 뒤로 가기 버튼으로 닫을 때 실행할 함수
 * @param title 다이얼로그 제목
 * @param children 제목 아래에 표시할 내용
 * @param footer 하단 버튼
 */
const Dialog = ({ visible, onClose, title, children, footer }: Props) => {
	const insets = useSafeAreaInsets();

	return (
		<Modal statusBarTranslucent visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<KeyboardAvoidingView
					behavior="padding"
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
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.backdrop,
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

export default Dialog;
