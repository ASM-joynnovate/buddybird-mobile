import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Share, StyleSheet, View } from "react-native"

import { InlineError } from "@/components/ui/inline-error"
import { PlayButton } from "@/components/ui/play-button"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { track } from "@/services/telemetry/client"
import { colors, font } from "@/theme"
import type { SessionSound } from "@/types/apis/sessions"

interface Props {
	sound: SessionSound
	wordName: string
	timeLabel: string
	player: SoundPlayer
}

export function SoundItem({ sound, wordName, timeLabel, player }: Props) {
	const { t } = useTranslation()

	const [shareFailed, setShareFailed] = useState(false)

	const playing = player.playingId === sound.id
	const url = sound.audio.url

	async function share() {
		if (!url) {
			return
		}

		try {
			setShareFailed(false)

			const result = await Share.share({ url, message: url })

			if (result.action === Share.sharedAction) {
				track("mimicry_shared", { session_id: sound.session_id })
			}
		} catch {
			setShareFailed(true)
		}
	}

	let message: string | null = null

	if (player.failedId === sound.id) {
		message = t("common.sound.playError")
	} else if (shareFailed) {
		message = t("common.sound.shareError")
	}

	return (
		<View>
			<PressableSurface
				accessibilityLabel={timeLabel}
				accessibilityHint={url ? t("common.sound.share") : undefined}
				onPress={() => {}}
				onLongPress={url ? () => void share() : undefined}
				disabled={!url}
				tone="plain"
				depth="none"
				cornerRadius="control"
				contentStyle={styles.row}
			>
				<View style={styles.info}>
					<Copy style={styles.time}>{timeLabel}</Copy>
					<Tag tone="primary" label={wordName} />
				</View>
				<PlayButton
					playing={playing}
					label={
						url
							? t(playing ? "common.sound.stop" : "common.sound.play", {
									time: timeLabel,
								})
							: t("common.sound.expired")
					}
					disabled={!url}
					onPress={() => {
						if (!url) {
							return
						}

						if (!playing) {
							track("mimicry_played", { session_id: sound.session_id })
						}

						player.toggle(sound.id, url)
					}}
				/>
			</PressableSurface>
			<InlineError message={message} />
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		minHeight: 60,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderWidth: 0,
	},
	info: { flex: 1, minWidth: 0, gap: 6 },
	time: {
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
})
