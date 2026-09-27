import type { LucideIcon } from "lucide-react-native"
import { ActivityIndicator, StyleSheet } from "react-native"

import { PressableSurface, type PressableSurfaceProps } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, depths, font } from "@/theme"

interface Props extends Omit<PressableSurfaceProps, "children" | "tone"> {
	label: string
	icon?: LucideIcon
	variant?: "primary" | "secondary"
	loading?: boolean
	compact?: boolean
}

export function Button({
	label,
	icon: Icon,
	variant = "primary",
	loading,
	compact,
	style,
	disabled,
	...props
}: Props) {
	const inactive = disabled || loading
	const depth = compact ? "high" : "xhigh"
	let tone: "primary" | "neutral" | "muted" = "primary"
	let foregroundColor = colors.onAccent

	if (variant === "secondary") {
		tone = "neutral"
		foregroundColor = colors.text
	}

	if (inactive) {
		tone = "muted"
		foregroundColor = colors.disabled
	}

	let leadingContent = null

	if (loading) {
		leadingContent = <ActivityIndicator color={foregroundColor} />
	} else if (Icon) {
		leadingContent = <Icon color={foregroundColor} size={compact ? 20 : 26} />
	}

	return (
		<PressableSurface
			{...props}
			accessibilityRole="button"
			accessibilityLabel={props.accessibilityLabel ?? label}
			accessibilityState={{
				...props.accessibilityState,
				disabled: Boolean(inactive),
				busy: Boolean(loading),
			}}
			disabled={inactive}
			tone={tone}
			depth={inactive ? "none" : depth}
			cornerRadius="control"
			style={[inactive && { marginTop: depths[depth] }, style]}
			contentStyle={[
				styles.button,
				{ borderWidth: variant === "secondary" ? 2 : 0 },
				compact && styles.compact,
			]}
		>
			{leadingContent}
			<Copy
				style={[
					styles.buttonText,
					{ color: foregroundColor },
					compact && styles.compactText,
				]}
			>
				{label}
			</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	button: {
		minHeight: 58,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 22,
		paddingVertical: 10,
	},
	buttonText: {
		fontFamily: font.extraBold,
		fontSize: 16,
		letterSpacing: 0.32,
		textTransform: "uppercase",
		textAlign: "center",
		flexShrink: 1,
		minWidth: 0,
	},
	compact: {
		minHeight: 42,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	compactText: { fontSize: 16 },
})
