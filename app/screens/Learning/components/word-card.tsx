import { memo } from "react"
import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { ChoiceCard } from "@/components/ui/surface"
import { Icon } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { categoryColors, colors, font, radius } from "@/theme"
import type  { Word } from "@/types/word"

export const WordCard = memo(function WordCard({
	item,
	selected,
	onSelect,
}: {
	item: Word
	selected: boolean
	onSelect(id: string): void
}) {
	const { t } = useTranslation()

	const palette = categoryColors[item.tag]

	return (
		<ChoiceCard
			testID={`learn-word-${item.id}`}
			accessibilityRole="button"
			accessibilityLabel={t("learning.selectWord", { word: item.label })}
			selected={selected}
			depth={2}
			cornerRadius={14}
			color={selected ? palette.color : colors.border}
			backgroundColor={selected ? palette.tint : colors.background}
			onPress={() => onSelect(item.id)}
			style={styles.wordSize}
			contentStyle={styles.word}
		>
			<View
				style={[
					styles.initial,
					{ backgroundColor: selected ? palette.color : palette.soft },
				]}
			>
				<Copy style={[styles.letter, selected && { color: colors.onAccent }]}>
					{Array.from(item.label)[0]}
				</Copy>
			</View>
			<Copy style={styles.wordLabel}>{item.label}</Copy>
			{selected ? (
				<View style={[styles.check, { backgroundColor: palette.color }]}>
					<Icon name="check" size={10} color={colors.onAccent} />
				</View>
			) : null}
		</ChoiceCard>
	)
})

const styles = StyleSheet.create({
	wordSize: { flexGrow: 1, minWidth: 0 },
	word: {
		minHeight: 84,
		paddingHorizontal: 6,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
	initial: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	letter: { fontFamily: font.black, fontSize: 16 },
	wordLabel: {
		fontFamily: font.extraBold,
		fontSize: 12.5,
		lineHeight: 16,
		textAlign: "center",
		width: "100%",
	},
	check: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 16,
		height: 16,
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
		alignItems: "center",
		justifyContent: "center",
	},
})
