import { TrashIcon } from "lucide-react-native"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { PlayButton } from "@/components/ui/play-button"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { formatDuration } from "@/i18n/format"
import type { DraftItem } from "@/screens/Words/hooks/use-word-draft"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

interface Props {
	item: DraftItem
	player: SoundPlayer
	index: number
	onDelete?(name: string): void
}

export function RecordingItem({ item, player, index, onDelete }: Props): ReactElement {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const name = t("words.editor.recordingName", { index: index + 1 })
	const playing = player.playingId === item.id

	return (
		<View style={[styles.row, index > 0 && styles.divider]}>
			<View style={styles.info}>
				<Copy style={styles.name}>{name}</Copy>
				<View style={styles.meta}>
					{item.durationMs === null ? null : (
						<Copy style={styles.detail}>{formatDuration(item.durationMs, locale)}</Copy>
					)}
					{item.kind === "local" ? (
						<Copy style={styles.unsaved}>{t("words.editor.unsaved")}</Copy>
					) : null}
				</View>
			</View>
			<IconButton
				icon={TrashIcon}
				label={t("words.editor.deleteRecording", { name })}
				variant="muted"
				disabled={!onDelete}
				onPress={() => onDelete?.(name)}
			/>
			<PlayButton
				playing={playing}
				label={t(playing ? "common.sound.stopNamed" : "words.editor.play", { name })}
				onPress={() => player.toggle(item.id, item.url)}
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
