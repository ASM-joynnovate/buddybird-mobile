import { File } from "expo-file-system"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { resolveRecordingUri } from "@/services/media/uri"
import { categoryColors, colors, font, radius } from "@/theme"
import type { Word } from "@/types/word"

export const WordListItem = memo(function WordListItem({
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
	const palette = categoryColors[item.tag]
	let playable = item.sourceType === "preset"

	if (item.sourceType === "recording") {
		try {
			playable = [item.transformedAudioUri, item.audioUri].some(
				(uri) => uri && new File(resolveRecordingUri(uri)).exists,
			)
		} catch (error) {
			console.warn("[word-preview] Audio unavailable", error)
		}
	}

	const previewLabel = t(isPlaying ? "words.stopPreview" : "words.preview", {
		word: item.label,
	})
	const sourceLabel = t(item.sourceType === "preset" ? "words.preset" : "words.recording")

	return (
		<Card
			cornerRadius={16}
			testID={`word-row-${item.id}`}
			style={styles.spacing}
			contentStyle={styles.word}
		>
			<View style={styles.description}>
				<Copy style={[styles.tag, { backgroundColor: palette.soft, color: palette.color }]}>
					{t(`categories.${item.tag}`)}
				</Copy>
				<Copy style={styles.label}>{item.label}</Copy>
				<View style={styles.sourceRow}>
					<Icon
						name={item.sourceType === "preset" ? "volume" : "mic"}
						size={13}
						color={colors.muted}
					/>
					<Copy style={styles.source}>{sourceLabel}</Copy>
				</View>
			</View>
			{item.sourceType === "recording" ? (
				<IconButton
					testID={`word-delete-${item.id}`}
					icon="trash"
					size={40}
					iconSize={17}
					depth={0}
					tone="neutral"
					round
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
				tone={palette.tone}
				disabled={!playable}
				size={40}
				iconSize={16}
				depth={2}
				round
				color={colors.onAccent}
			/>
		</Card>
	)
})

const styles = StyleSheet.create({
	spacing: { marginBottom: 10, gap: 4 },
	word: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	description: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: "50%",
		minWidth: 0,
		alignItems: "flex-start",
		gap: 4,
	},
	label: { fontSize: 18, fontFamily: font.black, width: "100%" },
	tag: {
		borderRadius: radius.pill,
		paddingHorizontal: 7,
		paddingVertical: 2,
		fontSize: 10,
	},
	sourceRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5 },
	source: { color: colors.muted, fontSize: 11.5 },
})
