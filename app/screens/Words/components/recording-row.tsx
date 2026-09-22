import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

export function RecordingRow({
	name,
	duration,
	unsaved,
	playing,
	deletable,
	first,
	onPlay,
	onDelete,
}: {
	name: string
	duration: string
	unsaved: boolean
	playing: boolean
	deletable: boolean
	first: boolean
	onPlay(): void
	onDelete(): void
}): ReactElement {
	const { t } = useTranslation()

	return (
		<View style={[styles.row, !first && styles.divider]}>
			<View style={styles.info}>
				<Copy style={styles.name}>{name}</Copy>
				<View style={styles.meta}>
					<Copy style={styles.detail}>{duration}</Copy>
					{unsaved ? (
						<Copy style={styles.unsaved}>{t("words.editor.unsaved")}</Copy>
					) : null}
				</View>
			</View>
			<IconButton
				icon="trash"
				label={t("words.editor.deleteRecording", { name })}
				color={colors.muted}
				disabled={!deletable}
				onPress={onDelete}
			/>
			<IconButton
				icon={playing ? "pause" : "play"}
				label={t(playing ? "words.editor.stop" : "words.editor.play", { name })}
				tone="primary"
				round
				color={colors.onAccent}
				size={44}
				iconSize={20}
				onPress={onPlay}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 10 },
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	info: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.extraBold, fontSize: 16 },
	meta: { flexDirection: "row", alignItems: "center", gap: 8 },
	unsaved: { color: colors.orangeDark, fontFamily: font.extraBold, fontSize: 12.5 },
	detail: { color: colors.muted, fontSize: 13.5, fontVariant: ["tabular-nums"] },
})
