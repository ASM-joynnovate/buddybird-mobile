import { StyleSheet } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { colors, radius } from "@/theme"

const variants = {
	plain: { tone: "plain", color: colors.text },
	muted: { tone: "plain", color: colors.muted },
	accent: { tone: "plain", color: colors.orange },
	primary: { tone: "primary", color: colors.onAccent },
} as const

const icons = {
	tiny: { size: 15, weight: "bold" },
	small: { size: 20, weight: undefined },
	medium: { size: 24, weight: undefined },
	large: { size: 28, weight: undefined },
	xlarge: { size: 34, weight: undefined },
} as const

type IconButtonVariant = keyof typeof variants

type IconButtonSize = keyof typeof icons

interface Props {
	icon: IconName
	label: string
	onPress(): void
	disabled?: boolean
	variant?: IconButtonVariant
	size?: IconButtonSize
}

function boxStyle(size: IconButtonSize) {
	return {
		tiny: boxes.tiny,
		small: boxes.small,
		medium: boxes.medium,
		large: boxes.large,
		xlarge: boxes.xlarge,
	}[size]
}

export function IconButton({
	icon,
	label,
	onPress,
	disabled,
	variant = "plain",
	size = "medium",
}: Props) {
	const { tone, color } = variants[variant]
	const round = variant === "primary"

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			tone={round && disabled ? "muted" : tone}
			depth={round ? 4 : 0}
			cornerRadius={round ? radius.pill : radius.control}
			style={[styles.shell, boxStyle(size)]}
			contentStyle={[styles.face, boxStyle(size)]}
		>
			<Icon
				name={icon}
				color={disabled ? colors.disabled : color}
				size={icons[size].size}
				weight={icons[size].weight}
			/>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	face: { flexGrow: 0, alignItems: "center", justifyContent: "center" },
})

const boxes = StyleSheet.create({
	tiny: { minWidth: 44, minHeight: 44 },
	small: { minWidth: 44, minHeight: 44 },
	medium: { minWidth: 48, minHeight: 48 },
	large: { minWidth: 64, minHeight: 64 },
	xlarge: { minWidth: 80, minHeight: 80 },
})
