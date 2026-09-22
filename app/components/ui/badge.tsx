import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

const tones = {
	primary: { face: colors.orangeSelected, edge: colors.orange, text: colors.orangeDark },
	danger: { face: colors.error, edge: colors.error, text: colors.onAccent },
	muted: { face: colors.surface, edge: colors.border, text: colors.muted },
} as const

export function CountBadge({
	count,
	tone = "primary",
	icon,
	label,
}: {
	count: number
	tone?: keyof typeof tones
	icon?: IconName
	label: string
}) {
	const palette = tones[tone]

	return (
		<View
			accessible
			accessibilityLabel={label}
			style={[styles.count, { backgroundColor: palette.face, borderColor: palette.edge }]}
		>
			{icon ? <Icon name={icon} size={13} color={palette.text} /> : null}
			<Copy style={[styles.countText, { color: palette.text }]}>{count}</Copy>
		</View>
	)
}

export function DotBadge({ label }: { label?: string }) {
	return <View accessible={Boolean(label)} accessibilityLabel={label} style={styles.dot} />
}

export function PageDots({ count, index, label }: { count: number; index: number; label: string }) {
	if (count < 2) {
		return null
	}

	return (
		<View style={styles.dots} accessible accessibilityLabel={label}>
			{Array.from({ length: count }, (_, item) => (
				<View key={item} style={[styles.page, item === index && styles.pageOn]} />
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	count: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		minWidth: 26,
		height: 24,
		paddingHorizontal: 8,
		borderRadius: radius.pill,
		borderWidth: 2,
		justifyContent: "center",
	},
	countText: { fontFamily: font.extraBold, fontSize: 12.5, fontVariant: ["tabular-nums"] },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
	dots: { flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center" },
	page: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.border },
	pageOn: { width: 18, backgroundColor: colors.orange },
})
