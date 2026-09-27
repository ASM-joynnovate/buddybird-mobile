import { StyleSheet } from "react-native"

import { CheckMark } from "@/components/ui/check-mark"
import { groupedListStyles } from "@/components/ui/grouped-list/styles"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

interface Props {
	label: string
	selected: boolean
	first?: boolean
	onPress(): void
}

export function GroupedListRadioItem({ label, selected, first, onPress }: Props) {
	return (
		<PressableSurface
			accessibilityRole="radio"
			accessibilityLabel={label}
			accessibilityState={{ checked: selected }}
			onPress={onPress}
			tone="plain"
			depth="none"
			cornerRadius="none"
			style={!first && groupedListStyles.divider}
			contentStyle={groupedListStyles.pressRow}
		>
			<Copy style={[groupedListStyles.label, styles.label, selected && styles.selected]}>
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
