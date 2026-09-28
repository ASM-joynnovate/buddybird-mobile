import { StyleSheet } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	label: string;
	selected?: boolean;
	onPress(): void;
}

export function Chip({ label, selected, onPress }: Props) {
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
			style={styles.shell}
			contentStyle={styles.chip}
		>
			<Copy numberOfLines={1} style={[styles.chipText, selected && styles.selectedText]}>
				{label}
			</Copy>
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	chip: {
		minHeight: 32,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 4,
	},
	chipText: { fontSize: 13.5, color: colors.muted, fontFamily: font.extraBold },
	selectedText: { color: colors.onAccent },
});
