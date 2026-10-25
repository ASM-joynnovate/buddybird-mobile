import { ChevronRightIcon } from 'lucide-react-native';

import { colors } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { type ItemBaseProps, ItemLabel } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props extends ItemBaseProps {
	value?: string;
	disabled?: boolean;
	onPress: () => void;
}

export const Item = ({ value, onPress, disabled, ...props }: Props) => {
	return (
		<PressableSurface
			accessibilityLabel={joinLabel(props.label, value)}
			disabled={disabled}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={!props.firstInGroup && itemStyles.divider}
			contentStyle={itemStyles.pressRow}
		>
			<ItemLabel {...props} />

			{!!value && <Copy style={itemStyles.value}>{value}</Copy>}
			<ChevronRightIcon size={18} color={colors.subtle} />
		</PressableSurface>
	);
};
