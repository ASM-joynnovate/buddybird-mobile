import { StyleSheet } from 'react-native';

import { colors } from '@/theme';

import { CheckMark } from '@/components/ui/check-mark';
import { Copy } from '@/components/ui/copy';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	label: string;
	selected: boolean;
	first?: boolean;
	onPress: () => void;
}

export const ItemRadio = ({ label, selected, first, onPress }: Props) => {
	return (
		<PressableSurface
			accessibilityRole="radio"
			accessibilityLabel={label}
			accessibilityState={{ checked: selected }}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={!first && itemStyles.divider}
			contentStyle={itemStyles.pressRow}
		>
			<Copy style={[itemStyles.label, styles.label, selected && styles.labelSelected]}>{label}</Copy>

			{selected && <CheckMark color={colors.orangeDark} />}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	label: { flex: 1 },
	labelSelected: { color: colors.orangeDark },
});
