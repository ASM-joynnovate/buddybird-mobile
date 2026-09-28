import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { GroupedListItemLabel, type GroupedListItemProps } from '@/components/ui/grouped-list/item-label';
import { groupedListStyles } from '@/components/ui/grouped-list/styles';
import { PressableSurface } from '@/components/ui/surface';
import { Copy } from '@/components/ui/text';

interface Props extends GroupedListItemProps {
	value?: string;
	dot?: boolean;
	disabled?: boolean;
	trailing?: ReactNode;
	onPress(): void;
}

export function GroupedListNavItem({ value, dot, onPress, disabled, trailing, ...props }: Props) {
	return (
		<PressableSurface
			accessibilityLabel={joinLabel(props.label, value)}
			disabled={disabled}
			onPress={onPress}
			tone="plain"
			depth="none"
			cornerRadius="none"
			style={!props.first && groupedListStyles.divider}
			contentStyle={groupedListStyles.pressRow}
		>
			<GroupedListItemLabel {...props} />
			{dot ? <View style={styles.dot} /> : null}
			{value ? <Copy style={styles.value}>{value}</Copy> : null}
			{trailing ?? <ChevronRightIcon size={18} color={colors.disabled} />}
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	value: { fontFamily: font.bold, fontSize: 14, color: colors.muted, flexShrink: 1 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
});
