import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { GroupedListCheckBox } from "@/components/ui/grouped-list/check-box"
import type { GroupedListItemProps } from "@/components/ui/grouped-list/item-label"
import { groupedListStyles } from "@/components/ui/grouped-list/styles"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

interface Props extends GroupedListItemProps {
	checked: boolean
	disabled?: boolean
	trailing?: ReactNode
	caption?: string
	captionTone?: "primary" | "muted"
	onToggle(): void
}

export function GroupedListCheckItem({
	checked,
	onToggle,
	disabled,
	trailing,
	caption,
	captionTone = "muted",
	...props
}: Props) {
	return (
		<PressableSurface
			accessibilityRole="checkbox"
			accessibilityLabel={props.label}
			accessibilityState={{ checked }}
			disabled={disabled}
			onPress={onToggle}
			tone="plain"
			depth="none"
			cornerRadius="none"
			style={!props.first && groupedListStyles.divider}
			contentStyle={groupedListStyles.pressRow}
		>
			<View style={groupedListStyles.labels}>
				{caption ? (
					<Copy
						style={[styles.caption, captionTone === "primary" && styles.captionPrimary]}
					>
						{caption}
					</Copy>
				) : null}
				<Copy style={groupedListStyles.label}>{props.label}</Copy>
				{props.detail ? <Copy style={groupedListStyles.detail}>{props.detail}</Copy> : null}
			</View>
			{trailing}
			<GroupedListCheckBox checked={checked} disabled={disabled} onPress={onToggle} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	caption: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	captionPrimary: { color: colors.orangeDark },
})
