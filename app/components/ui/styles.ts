import { StyleSheet } from 'react-native';

import { colors, font } from '@/theme';

export const ui = StyleSheet.create({
	controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	actionsRow: { flexDirection: 'row', gap: 12 },
	action: { flex: 1, minWidth: 0 },
	tabContent: { paddingBottom: 24 },
	label: { fontSize: 16, fontFamily: font.extraBold, color: colors.muted, marginBottom: 10 },
	sectionContainer: { marginTop: 20 },
	sectionTitle: { fontSize: 18, lineHeight: 24, fontFamily: font.black, marginBottom: 10 },
	subtitle: { color: colors.muted, marginTop: 6, marginBottom: 24 },
	messageContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 32 },
	messageText: {
		fontFamily: font.extraBold,
		fontSize: 16,
		lineHeight: 22,
		color: colors.text,
		textAlign: 'center',
	},
});
