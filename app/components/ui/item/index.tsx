import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { type ItemBaseProps, ItemLabel } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props extends ItemBaseProps {
	value?: string;
	showDot?: boolean;
	disabled?: boolean;
	trailing?: ReactNode;
	onPress(): void;
}

export function Item({ value, showDot, onPress, disabled, trailing, ...props }: Props) {
	return (
		<PressableSurface
			accessibilityLabel={joinLabel(props.label, value)}
			disabled={disabled}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={!props.first && itemStyles.divider}
			contentStyle={itemStyles.pressRow}
		>
			<ItemLabel {...props} />
			{showDot ? <View style={styles.dot} /> : null}
			{value ? <Copy style={styles.value}>{value}</Copy> : null}
			{trailing ?? <ChevronRightIcon size={18} color={colors.subtle} />}
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	value: { fontFamily: font.bold, fontSize: 14, color: colors.muted, flexShrink: 1 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
});
