import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { ChoiceCard } from "@/components/ui/surface"
import { Icon } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"
import type { Word } from "@/types/word"

export function WordCard({
	item,
	selected,
	onSelect,
}: {
	item: Word
	selected: boolean
	onSelect(id: string): void
}) {
	const { t } = useTranslation()

	let initialColor = colors.orangeSoft

	if (selected) {
		initialColor = colors.orange
	} else if (item.tag === "name") {
		initialColor = colors.purpleSoft
	} else if (item.tag === "food") {
		initialColor = colors.blueSoft
	}

	return (
		<ChoiceCard
			testID={`learn-word-${item.id}`}
			accessibilityRole="button"
			accessibilityLabel={t("learning.selectWord", { word: item.label })}
			selected={selected}
			onPress={() => onSelect(item.id)}
			style={styles.wordSize}
			contentStyle={styles.word}
		>
			<View style={[styles.initial, { backgroundColor: initialColor }]}>
				<Copy style={[styles.letter, selected && { color: colors.onAccent }]}>
					{Array.from(item.label)[0]}
				</Copy>
			</View>
			<Copy numberOfLines={1} ellipsizeMode="tail" style={styles.wordLabel}>
				{item.label}
			</Copy>
			{selected ? (
				<View style={styles.check}>
					<Icon name="check" size={14} color={colors.onAccent} />
				</View>
			) : null}
		</ChoiceCard>
	)
}

const styles = StyleSheet.create({
	wordSize: { width: "31.5%" },
	word: {
		minHeight: 98,
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	initial: {
		width: 40,
		height: 40,
		borderRadius: radius.control,
		alignItems: "center",
		justifyContent: "center",
	},
	letter: { fontFamily: font.black, fontSize: 23 },
	wordLabel: { fontFamily: font.extraBold, fontSize: 16, textAlign: "center", width: "100%" },
	check: {
		position: "absolute",
		top: 7,
		right: 7,
		width: 20,
		height: 20,
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
		alignItems: "center",
		justifyContent: "center",
	},
})
