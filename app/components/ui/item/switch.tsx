import { Switch, View } from 'react-native';

import { colors } from '@/theme';

import { type ItemBaseProps, ItemLabel } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';

interface Props extends ItemBaseProps {
	value: boolean;
	onChange: (value: boolean) => void;
}

export const ItemSwitch = ({ value, onChange, ...props }: Props) => {
	return (
		<View style={[itemStyles.row, !props.first && itemStyles.divider]}>
			{/*아이콘, 이름, 설명*/}
			<ItemLabel {...props} />

			{/*켜고 끄는 스위치*/}
			<Switch
				accessibilityLabel={props.label}
				value={value}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.orange }}
				thumbColor={colors.background}
				ios_backgroundColor={colors.border}
			/>
		</View>
	);
};
