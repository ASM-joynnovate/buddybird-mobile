import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { formatMoment } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { SessionSound } from "@/types/apis/sessions"

export function MimicryBubble({
	sound,
	wordName,
	player,
	onOpen,
}: {
	sound: SessionSound
	wordName: string
	player: SoundPlayer
	onOpen(): void
}) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const playing = player.playingId === sound.id
	const url = sound.audio.url
	const time = formatMoment(sound.captured_at, locale)

	return (
		<PressableSurface
			depth={2}
			cornerRadius={16}
			onPress={onOpen}
			accessibilityLabel={t("home.mimicry.label", { word: wordName, time })}
			contentStyle={styles.bubble}
		>
			<View pointerEvents="none" style={styles.pointer} />
			<View style={styles.text}>
				<View style={styles.row}>
					<Tag tone="primary" label={wordName} />
					<Copy style={styles.said}>{t("home.mimicry.said")}</Copy>
				</View>
				<Copy style={styles.time}>{time}</Copy>
			</View>
			<IconButton
				icon={playing ? "pause" : "play"}
				label={t(playing ? "common.sound.stop" : "common.sound.play", { time })}
				tone={url ? "primary" : "muted"}
				round
				size={44}
				iconSize={18}
				color={colors.onAccent}
				disabled={!url}
				onPress={() => {
					if (url) {
						player.toggle(sound.id, url)
					}
				}}
			/>
		</PressableSurface>
	)
}

export function BuddyHint() {
	const { t } = useTranslation()

	return <SpeechBubble side="bottom">{t("home.mimicry.empty")}</SpeechBubble>
}

const styles = StyleSheet.create({
	bubble: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	pointer: {
		position: "absolute",
		top: -10,
		left: 32,
		width: 16,
		height: 16,
		backgroundColor: colors.background,
		borderLeftWidth: 2,
		borderTopWidth: 2,
		borderColor: colors.border,
		transform: [{ rotate: "45deg" }],
	},
	text: { flex: 1, minWidth: 0, gap: 4 },
	row: { flexDirection: "row", alignItems: "center", gap: 6 },
	said: { fontFamily: font.extraBold, fontSize: 15, color: colors.text },
	time: { fontSize: 13, color: colors.muted },
})
