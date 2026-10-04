import { Switch, View } from 'react-native';

import { colors } from '@/theme';

import { type ItemBaseProps, ItemLabel } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';

interface Props extends ItemBaseProps {
	value: boolean;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}

export const ItemSwitch = ({ value, disabled, onChange, ...props }: Props) => {
	return (
		<View style={[itemStyles.itemRow, !props.first && itemStyles.divider]}>
			<ItemLabel {...props} />

			<Switch
				accessibilityLabel={props.label}
				value={value}
				disabled={disabled}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.orange }}
				thumbColor={colors.background}
				ios_backgroundColor={colors.border}
			/>
		</View>
	);
};
