import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

interface Props {
	message: string
	illustration?: ReactNode
	action?: { label: string; onPress(): void }
}

export function EmptyState({ message, illustration, action }: Props) {
	return (
		<View style={styles.center}>
			{illustration}
			<Copy style={styles.message}>{message}</Copy>
			{action ? (
				<Button label={action.label} onPress={action.onPress} style={styles.action} />
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	center: { alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 32 },
	message: {
		fontFamily: font.extraBold,
		fontSize: 16,
		lineHeight: 22,
		color: colors.text,
		textAlign: "center",
	},
	action: { alignSelf: "stretch" },
})
