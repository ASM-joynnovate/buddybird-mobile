import { StyleSheet } from "react-native"

import { colors, font } from "@/theme"

export const ui = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	label: { fontSize: 16, fontFamily: font.extraBold, color: colors.muted, marginBottom: 10 },
	section: { marginTop: 24 },
	sectionTitle: { fontSize: 23, fontFamily: font.black, marginBottom: 14 },
	subtitle: { color: colors.muted, marginTop: 6, marginBottom: 24 },
})
