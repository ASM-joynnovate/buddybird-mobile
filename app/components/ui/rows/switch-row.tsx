import { ActivityIndicator, Switch, View } from "react-native"

import { RowLabel, type RowProps } from "@/components/ui/rows/row-label"
import { rowStyles } from "@/components/ui/rows/styles"
import { colors } from "@/theme"

interface Props extends RowProps {
	value: boolean
	disabled?: boolean
	busy?: boolean
	onChange(value: boolean): void
}

export function SwitchRow({ value, onChange, disabled, busy, ...props }: Props) {
	return (
		<View style={[rowStyles.row, !props.first && rowStyles.divider]}>
			<RowLabel {...props} />
			{busy ? <ActivityIndicator color={colors.orange} /> : null}
			<Switch
				accessibilityLabel={props.label}
				value={value}
				disabled={disabled || busy}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.orange }}
				thumbColor={colors.background}
				ios_backgroundColor={colors.border}
			/>
		</View>
	)
}
