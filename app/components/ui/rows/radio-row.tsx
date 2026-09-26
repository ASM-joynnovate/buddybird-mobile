import { StyleSheet } from "react-native"

import { CheckMark } from "@/components/ui/check-mark"
import { rowStyles } from "@/components/ui/rows/styles"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

interface Props {
	label: string
	selected: boolean
	first?: boolean
	onPress(): void
}

export function RadioRow({ label, selected, first, onPress }: Props) {
	return (
		<PressableSurface
			accessibilityRole="radio"
			accessibilityLabel={label}
			accessibilityState={{ checked: selected }}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={!first && rowStyles.divider}
			contentStyle={rowStyles.pressRow}
		>
			<Copy style={[rowStyles.label, styles.label, selected && styles.selected]}>
				{label}
			</Copy>
			{selected ? <CheckMark color={colors.orangeDark} /> : null}
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	label: { flex: 1 },
	selected: { color: colors.orangeDark },
})
