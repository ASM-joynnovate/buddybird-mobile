import { ActivityIndicator, StyleSheet } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface, type PressableSurfaceProps } from "@/components/ui/surface"
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
		foregroundColor = colors.disabled
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
			accessibilityState={{
				...props.accessibilityState,
				disabled: Boolean(inactive),
				busy: Boolean(loading),
			}}
			disabled={inactive}
			tone={tone}
			depth={inactive ? 0 : compact ? 4 : 7}
			cornerRadius={radius.control}
			style={style}
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
					{
						color: foregroundColor,
						fontFamily: /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(label) ? font.extraBold : font.rounded,
					},
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
