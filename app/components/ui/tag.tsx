import { StyleSheet, View } from "react-native"

import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

const tones = {
	primary: { face: colors.orangeSelected, edge: colors.orange, text: colors.orangeDark },
	blue: { face: colors.blueSoft, edge: colors.blue, text: colors.blueDark },
	muted: { face: colors.surface, edge: colors.border, text: colors.muted },
} as const

export type TagTone = keyof typeof tones

export function Tag({ label, tone = "muted" }: { label: string; tone?: TagTone }) {
	const palette = tones[tone]

	return (
		<View style={[styles.tag, { backgroundColor: palette.face, borderColor: palette.edge }]}>
			<Copy numberOfLines={1} style={[styles.text, { color: palette.text }]}>
				{label}
			</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	tag: {
		alignSelf: "flex-start",
		flexShrink: 1,
		borderWidth: 2,
		borderRadius: radius.pill,
		paddingHorizontal: 10,
		paddingVertical: 2,
	},
	text: { fontFamily: font.extraBold, fontSize: 13 },
})
