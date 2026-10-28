import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { DotBadge } from '@/components/ui/dot-badge';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	label: string;
	leading?: ReactNode;
	selected?: boolean;
	showDot?: boolean;
	size?: 'small' | 'medium';
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
}

export const Chip = ({ label, leading, selected, showDot, size = 'medium', onPress, style }: Props) => {
	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			variant={selected ? 'primary' : 'neutral'}
			depth="low"
			hitSlop={6}
			cornerRadius={size === 'small' ? 'toggle' : 'pill'}
			style={[styles.shell, style]}
			contentStyle={[styles.chip, size === 'small' && styles.chipSmall]}
		>
			{leading}
			<Copy numberOfLines={1} style={[styles.chipText, selected && styles.selectedText]}>
				{label}
			</Copy>
			{showDot && <DotBadge />}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	chip: {
		minHeight: 32,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 4,
	},
	chipSmall: { paddingHorizontal: 10 },
	chipText: { flexShrink: 1, fontSize: 13.5, color: colors.muted, fontFamily: font.extraBold },
	selectedText: { color: colors.onFilled },
});
