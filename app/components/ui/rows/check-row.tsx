import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { CheckBox } from "@/components/ui/rows/check-box"
import type { RowProps } from "@/components/ui/rows/row-label"
import { rowStyles } from "@/components/ui/rows/styles"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

interface Props extends RowProps {
	checked: boolean
	disabled?: boolean
	trailing?: ReactNode
	caption?: string
	captionTone?: "primary" | "muted"
	onToggle(): void
}

export function CheckRow({
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
			depth={0}
			cornerRadius={0}
			style={!props.first && rowStyles.divider}
			contentStyle={rowStyles.pressRow}
		>
			<View style={rowStyles.labels}>
				{caption ? (
					<Copy
						style={[styles.caption, captionTone === "primary" && styles.captionPrimary]}
					>
						{caption}
					</Copy>
				) : null}
				<Copy style={rowStyles.label}>{props.label}</Copy>
				{props.detail ? <Copy style={rowStyles.detail}>{props.detail}</Copy> : null}
			</View>
			{trailing}
			<CheckBox checked={checked} disabled={disabled} onPress={onToggle} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	caption: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	captionPrimary: { color: colors.orangeDark },
})
