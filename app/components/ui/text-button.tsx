import { StyleSheet } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

interface Props {
	label: string
	onPress(): void
	disabled?: boolean
	tone?: "primary" | "muted"
}

export function TextButton({ label, onPress, disabled, tone = "primary" }: Props) {
	return (
		<PressableSurface
			accessibilityLabel={label}
			disabled={disabled}
			onPress={onPress}
			tone="plain"
			depth="none"
			cornerRadius="control"
			contentStyle={styles.textButton}
		>
			<Copy
				style={[
					styles.textButtonLabel,
					tone === "muted" && styles.muted,
					disabled && styles.disabled,
				]}
			>
				{label}
			</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8, borderWidth: 0 },
	textButtonLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
	muted: { color: colors.muted },
	disabled: { color: colors.disabled },
})
