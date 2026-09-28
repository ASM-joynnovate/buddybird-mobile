import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/text';

interface Props {
	label: string;
	value: string;
	size?: 'small' | 'large';
}

export function Stat({ label, value, size = 'small' }: Props) {
	if (size === 'large') {
		return (
			<View style={styles.line} accessible accessibilityLabel={joinLabel(label, value)}>
				<Copy style={styles.largeLabel}>{label}</Copy>
				<Copy style={styles.largeValue}>{value}</Copy>
			</View>
		);
	}

	return (
		<Copy style={styles.smallLabel}>
			{label} <Copy style={styles.smallValue}>{value}</Copy>
		</Copy>
	);
}

const styles = StyleSheet.create({
	line: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: 12,
	},
	largeLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.muted },
	largeValue: { flexShrink: 1, fontFamily: font.black, fontSize: 22, color: colors.text },
	smallLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	smallValue: {
		fontFamily: font.black,
		fontSize: 14,
		color: colors.text,
		fontVariant: ['tabular-nums'],
	},
});
