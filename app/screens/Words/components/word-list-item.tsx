import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"
import { Word } from "@/types/word"

export function WordListItem({
	item,
	isPlaying,
	confirmDelete,
	preview,
}: {
	item: Word
	isPlaying: boolean
	confirmDelete(word: Word): void
	preview(word: Word): Promise<void>
}) {
	const { t } = useTranslation()
	let categoryTint = colors.orangeSoft

	if (item.tag === "name") {
		categoryTint = colors.purpleSoft
	} else if (item.tag === "food") {
		categoryTint = colors.blueSoft
	}

	const previewLabel = t(isPlaying ? "words.stopPreview" : "words.preview", {
		word: item.label,
	})
	const sourceLabel = t(item.sourceType === "preset" ? "words.preset" : "words.recording")

	return (
		<Card testID={`word-row-${item.id}`} style={styles.spacing} contentStyle={styles.word}>
			<View style={styles.description}>
				<Copy style={[styles.tag, { backgroundColor: categoryTint }]}>
					{t(`categories.${item.tag}`)}
				</Copy>
				<Copy numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
					{item.label}
				</Copy>
				<Copy style={styles.source}>{sourceLabel}</Copy>
			</View>
			{item.sourceType === "recording" ? (
				<IconButton
					testID={`word-delete-${item.id}`}
					icon="trash"
					label={t("words.delete", { word: item.label })}
					onPress={() => confirmDelete(item)}
					color={colors.muted}
				/>
			) : null}
			<IconButton
				testID={`word-preview-${item.id}`}
				icon={isPlaying ? "stop" : "play"}
				label={previewLabel}
				onPress={() => void preview(item)}
				tone="primary"
				round
				color={colors.onAccent}
			/>
		</Card>
	)
}

const styles = StyleSheet.create({
	spacing: { marginBottom: 10, gap: 4 },
	word: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 14,
	},
	description: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 4 },
	label: { fontSize: 20, fontFamily: font.extraBold, width: "100%" },
	tag: {
		color: colors.orange,
		borderRadius: radius.pill,
		paddingHorizontal: 7,
		paddingVertical: 2,
		fontSize: 11,
	},
	source: { color: colors.muted, fontSize: 13 },
})
