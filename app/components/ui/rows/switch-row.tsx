import { Switch, View } from "react-native"

import { RowLabel, type RowProps } from "@/components/ui/rows/row-label"
import { rowStyles } from "@/components/ui/rows/styles"
import { colors } from "@/theme"

interface Props extends RowProps {
	value: boolean
	onChange(value: boolean): void
}

export function SwitchRow({ value, onChange, ...props }: Props) {
	return (
		<View style={[rowStyles.row, !props.first && rowStyles.divider]}>
			<RowLabel {...props} />
			<Switch
				accessibilityLabel={props.label}
				value={value}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.orange }}
				thumbColor={colors.background}
				ios_backgroundColor={colors.border}
			/>
		</View>
	)
}
