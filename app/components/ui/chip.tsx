import { StyleSheet } from "react-native"

import { PressableSurface, type SurfaceTone } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

interface Props {
	label: string
	selected?: boolean
	tone?: SurfaceTone
	disabled?: boolean
	onPress(): void
}

export function Chip({ label, selected, onPress, tone = "primary", disabled = false }: Props) {
	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			tone={selected ? tone : "neutral"}
			depth={2}
			disabled={disabled}
			hitSlop={6}
			cornerRadius={radius.pill}
			style={styles.shell}
			contentStyle={styles.chip}
		>
			<Copy numberOfLines={1} style={[styles.chipText, selected && styles.selectedText]}>
				{label}
			</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	chip: {
		minHeight: 32,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 4,
	},
	chipText: { fontSize: 13.5, color: colors.muted, fontFamily: font.extraBold },
	selectedText: { color: colors.onAccent },
})
