import { PropsWithChildren } from "react"

import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from "react-native"

import { GestureHandlerRootView } from "react-native-gesture-handler"

import { Title } from "@/components/ui/text"
import { colors, radius } from "@/theme"

export function Dialog({
	visible,
	onClose,
	title,
	children,
}: PropsWithChildren<{ visible: boolean; onClose(): void; title: string }>) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.backdrop}
				>
					<View accessibilityViewIsModal style={styles.dialog}>
						<ScrollView
							keyboardShouldPersistTaps="handled"
							contentContainerStyle={styles.content}
						>
							<Title style={styles.title}>{title}</Title>
							{children}
						</ScrollView>
					</View>
				</KeyboardAvoidingView>
			</GestureHandlerRootView>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.42)",
		padding: 20,
	},
	dialog: {
		width: "100%",
		maxWidth: 520,
		maxHeight: "90%",
		borderRadius: radius.hero,
		backgroundColor: colors.background,
	},
	content: { padding: 22 },
	title: { fontSize: 26, lineHeight: 33, marginBottom: 22 },
})
