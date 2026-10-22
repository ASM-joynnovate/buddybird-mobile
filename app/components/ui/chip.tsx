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
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
}

export const Chip = ({ label, leading, selected, showDot, onPress, style }: Props) => {
	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			variant={selected ? 'primary' : 'neutral'}
			depth="low"
			hitSlop={6}
			cornerRadius="pill"
			style={[styles.shell, style]}
			contentStyle={styles.chip}
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
	chipText: { fontSize: 13.5, color: colors.muted, fontFamily: font.extraBold },
	selectedText: { color: colors.onFilled },
});
