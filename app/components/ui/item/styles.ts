import { StyleSheet } from 'react-native';

import { colors, font } from '@/theme';

export const itemStyles = StyleSheet.create({
	itemRow: {
		minHeight: 56,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	pressRow: {
		minHeight: 56,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 0,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	label: { fontFamily: font.extraBold, fontSize: 16, color: colors.text },
	value: { fontFamily: font.bold, fontSize: 14, color: colors.muted, flexShrink: 1 },
	detail: { fontSize: 13, color: colors.muted },
});
