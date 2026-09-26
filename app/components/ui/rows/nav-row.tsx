import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { RowLabel, type RowProps } from "@/components/ui/rows/row-label"
import { rowStyles } from "@/components/ui/rows/styles"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"
import { joinLabel } from "@/utils/a11y"

interface Props extends RowProps {
	value?: string
	dot?: boolean
	disabled?: boolean
	expanded?: boolean
	trailing?: ReactNode
	onPress(): void
}

export function NavRow({ value, dot, onPress, disabled, expanded, trailing, ...props }: Props) {
	return (
		<PressableSurface
			accessibilityLabel={joinLabel(props.label, value)}
			accessibilityState={{ expanded }}
			disabled={disabled}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={!props.first && rowStyles.divider}
			contentStyle={rowStyles.pressRow}
		>
			<RowLabel {...props} />
			{dot ? <View style={styles.dot} /> : null}
			{value ? <Copy style={styles.value}>{value}</Copy> : null}
			{trailing ?? <Icon name="forward" size={18} color={colors.disabled} />}
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	value: { fontFamily: font.bold, fontSize: 14, color: colors.muted, flexShrink: 1 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
})
