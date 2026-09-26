import { StyleSheet } from "react-native"

import { colors, font } from "@/theme"

export const rowStyles = StyleSheet.create({
	row: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	pressRow: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 0,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	labels: { flex: 1, minWidth: 0, gap: 2 },
	label: { fontFamily: font.extraBold, fontSize: 16, color: colors.text },
	detail: { fontSize: 13, color: colors.muted },
})
