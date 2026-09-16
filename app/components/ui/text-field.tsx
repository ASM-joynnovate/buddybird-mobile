import { StyleSheet, TextInput, type TextInputProps, View } from "react-native"

import { Copy } from "@/components/ui/text"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { colors, font } from "@/theme"

export function TextField({
	label,
	error,
	style,
	accessibilityLabel,
	...props
}: TextInputProps & { label?: string; error?: string | null }) {
	return (
		<View>
			{label ? <Copy style={ui.label}>{label}</Copy> : null}
			<TextInput
				{...props}
				accessibilityLabel={accessibilityLabel ?? label}
				allowFontScaling={false}
				placeholderTextColor={colors.muted}
				style={[styles.input, error && { borderColor: colors.error }, style]}
			/>
			<InlineError message={error} />
		</View>
	)
}

const styles = StyleSheet.create({
	input: {
		minHeight: 50,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontFamily: font.bold,
		fontSize: 16,
		color: colors.text,
	},
})
