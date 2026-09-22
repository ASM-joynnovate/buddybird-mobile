import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { formatDuration } from "@/i18n/format"
import { RecordingRow } from "@/screens/Words/components/recording-row"
import {
	type DraftItem,
	MAX_RECORDINGS,
	RECOMMENDED_RECORDINGS,
} from "@/screens/Words/hooks/use-word-draft"
import { colors, font } from "@/theme"
import type { Locale } from "@/types/locale"

export function RecordingsSection({
	items,
	serverCount,
	player,
	locale,
	missing,
	disabled,
	onDelete,
	onAdd,
	onHelp,
}: {
	items: DraftItem[]
	serverCount: number
	player: SoundPlayer
	locale: Locale
	missing: boolean
	disabled: boolean
	onDelete(item: DraftItem, name: string): void
	onAdd(): void
	onHelp(): void
}): ReactElement {
	const { t } = useTranslation()

	return (
		<View style={ui.section}>
			<View style={styles.header}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t("words.editor.recordings", { count: items.length })}
				</Copy>
				<IconButton
					icon="help"
					label={t("words.editor.guide")}
					color={colors.muted}
					onPress={onHelp}
				/>
			</View>
			{items.map((item, index) => {
				const name = t("words.editor.recordingName", { index: index + 1 })

				return (
					<RecordingRow
						key={item.id}
						first={index === 0}
						name={name}
						duration={formatDuration(item.durationMs, locale)}
						unsaved={item.kind === "local"}
						playing={player.playingId === item.id}
						deletable={!disabled && !(item.kind === "server" && serverCount <= 1)}
						onPlay={() => player.toggle(item.id, item.url)}
						onDelete={() => onDelete(item, name)}
					/>
				)
			})}
			<InlineError message={player.failedId ? t("common.sound.playError") : null} />
			<InlineError message={missing ? t("words.editor.recordingRequired") : null} />
			{items.length < MAX_RECORDINGS ? (
				<Button
					label={t("words.editor.addRecording")}
					icon="mic"
					variant="secondary"
					disabled={disabled}
					onPress={onAdd}
					style={styles.add}
				/>
			) : null}
			{items.length < RECOMMENDED_RECORDINGS ? (
				<Copy style={styles.hint}>{t("words.editor.recommend")}</Copy>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
	title: { flex: 1, fontSize: 18, lineHeight: 24, fontFamily: font.black },
	add: { marginTop: 12 },
	hint: { color: colors.muted, marginTop: 10 },
})
