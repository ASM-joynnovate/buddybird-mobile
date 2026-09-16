import { StyleSheet } from "react-native"

import { colors, font } from "@/theme"

export const ui = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	actions: { flexDirection: "row", gap: 12 },
	action: { flex: 1, minWidth: 0 },
	tabContent: { paddingBottom: 24 },
	label: { fontSize: 16, fontFamily: font.extraBold, color: colors.muted, marginBottom: 10 },
	section: { marginTop: 20 },
	sectionTitle: { fontSize: 18, lineHeight: 24, fontFamily: font.black, marginBottom: 10 },
	subtitle: { color: colors.muted, marginTop: 6, marginBottom: 24 },
})
