import { View } from 'react-native';

import { type ItemBaseProps, ItemLabel } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';
import { Toggle } from '@/components/ui/toggle';

interface Props extends ItemBaseProps {
	value: boolean;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}

export const ItemSwitch = ({ value, disabled, onChange, ...props }: Props) => {
	return (
		<View style={[itemStyles.itemRow, !props.isFirstInGroup && itemStyles.divider]}>
			<ItemLabel {...props} />

			<Toggle label={props.label} value={value} disabled={disabled} onChange={onChange} />
		</View>
	);
};
