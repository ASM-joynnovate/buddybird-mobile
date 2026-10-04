import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { CheckMark } from '@/components/ui/check-mark';
import { Copy } from '@/components/ui/copy';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	label: string;
	value?: string;
	highlight?: string;
	selected: boolean;
	first?: boolean;
	onPress: () => void;
}

export const ItemRadio = ({ label, value, highlight, selected, first, onPress }: Props) => {
	const highlightStart = highlight ? label.toLowerCase().indexOf(highlight.toLowerCase()) : -1;
	const highlightEnd = highlightStart + (highlight?.length ?? 0);

	return (
		<PressableSurface
			accessibilityRole="radio"
			accessibilityLabel={joinLabel(label, value)}
			accessibilityState={{ checked: selected }}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={!first && itemStyles.divider}
			contentStyle={itemStyles.pressRow}
		>
			<Copy style={[itemStyles.label, styles.label, selected && styles.labelSelected]}>
				{highlightStart < 0 ? (
					label
				) : (
					<>
						{label.slice(0, highlightStart)}
						<Text style={styles.highlight}>{label.slice(highlightStart, highlightEnd)}</Text>
						{label.slice(highlightEnd)}
					</>
				)}
			</Copy>

			{!!value && <Copy style={itemStyles.value}>{value}</Copy>}
			{selected && <CheckMark color={colors.orangeDark} />}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	label: { flex: 1 },
	labelSelected: { color: colors.orangeDark },
	highlight: { backgroundColor: colors.orangeSoft },
});
