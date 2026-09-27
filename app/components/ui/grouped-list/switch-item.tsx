import { Switch, View } from "react-native"

import {
	GroupedListItemLabel,
	type GroupedListItemProps,
} from "@/components/ui/grouped-list/item-label"
import { groupedListStyles } from "@/components/ui/grouped-list/styles"
import { colors } from "@/theme"

interface Props extends GroupedListItemProps {
	value: boolean
	onChange(value: boolean): void
}

export function GroupedListSwitchItem({ value, onChange, ...props }: Props) {
	return (
		<View style={[groupedListStyles.row, !props.first && groupedListStyles.divider]}>
			<GroupedListItemLabel {...props} />
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
