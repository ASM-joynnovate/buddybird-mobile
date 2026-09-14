import { ActivityIndicator, StyleSheet } from "react-native"

import { PressableSurface, PressableSurfaceProps } from "@/components/ui/surface"
import { Icon, IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

type ButtonProps = Omit<PressableSurfaceProps, "children" | "tone"> & {
	label: string
	icon?: IconName
	variant?: "primary" | "secondary" | "blue"
	loading?: boolean
	compact?: boolean
}

export function Button({
	label,
	icon,
	variant = "primary",
	loading,
	compact,
	style,
	disabled,
	...props
}: ButtonProps) {
	const inactive = disabled || loading
	let tone: "primary" | "neutral" | "blue" | "muted" = "primary"
	let foregroundColor = colors.onAccent

	if (variant === "secondary") {
		tone = "neutral"
		foregroundColor = colors.text
	} else if (variant === "blue") {
		tone = "blue"
		foregroundColor = colors.background
	}

	if (inactive) {
		tone = "muted"
		foregroundColor = colors.muted
	}

	let leadingContent = null

	if (loading) {
		leadingContent = <ActivityIndicator color={foregroundColor} />
	} else if (icon) {
		leadingContent = <Icon name={icon} color={foregroundColor} size={compact ? 20 : 26} />
	}

	return (
		<PressableSurface
			{...props}
			accessibilityRole="button"
			accessibilityLabel={props.accessibilityLabel ?? label}
			accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
			disabled={inactive}
			tone={tone}
			cornerRadius={radius.control}
			style={style}
			contentStyle={[styles.button, compact && styles.compact]}
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
		minHeight: 62,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	buttonText: { fontFamily: font.extraBold, fontSize: 20, textAlign: "center", flexShrink: 1 },
	compact: {
		minHeight: 48,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	compactText: { fontSize: 16 },
})
