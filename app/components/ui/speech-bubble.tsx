import type { PropsWithChildren } from "react"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"

import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

export function SpeechBubble({
	children,
	side = "bottom",
	style,
}: PropsWithChildren<{ side?: "bottom" | "left"; style?: StyleProp<ViewStyle> }>) {
	return (
		<Card cornerRadius={16} style={style} contentStyle={styles.bubble}>
			<View
				pointerEvents="none"
				style={[styles.pointer, side === "left" ? styles.left : styles.bottom]}
			/>
			<Copy style={styles.text}>{children}</Copy>
		</Card>
	)
}

const styles = StyleSheet.create({
	bubble: {
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: "left" },
	pointer: {
		position: "absolute",
		width: 16,
		height: 16,
		backgroundColor: colors.background,
		borderRightWidth: 2,
		borderBottomWidth: 2,
		borderColor: colors.border,
	},
	bottom: { bottom: -10, left: "50%", transform: [{ translateX: -8 }, { rotate: "45deg" }] },
	left: { left: -10, bottom: 18, transform: [{ rotate: "135deg" }] },
})
