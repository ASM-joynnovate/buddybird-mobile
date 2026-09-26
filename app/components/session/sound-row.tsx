import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Share, StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { PlayButton } from "@/components/ui/play-button"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import type { TimelineSound } from "@/mocks/types"
import { colors, font, radius } from "@/theme"

type Feedback = "up" | "down"

export interface SoundFeedback {
	feedbackOf(soundId: string): Feedback | null
	failedId: string | null
	choose(soundId: string, value: Feedback): void
}

interface Props {
	sound: TimelineSound
	timeLabel: string
	controls: { player: SoundPlayer; feedback: SoundFeedback }
	highlighted?: boolean
	onPress?(): void
}

function similarityLevel(score: number): 1 | 2 | 3 {
	if (score < 0.6) {
		return 1
	}

	return score < 0.8 ? 2 : 3
}

export function SoundRow({ sound, timeLabel, controls, highlighted, onPress }: Props) {
	const { t } = useTranslation()

	const [shareFailed, setShareFailed] = useState(false)

	const { player } = controls
	const feedback = controls.feedback.feedbackOf(sound.id)
	const playing = player.playingId === sound.id
	const heard = player.finishedIds.has(sound.id) || feedback !== null
	const mimicked = Boolean(sound.judgment?.word_id)
	const score = sound.analysis?.score
	const level = mimicked && score != null ? similarityLevel(score) : 0
	const url = sound.audio.url

	async function share() {
		if (!url) {
			return
		}

		try {
			setShareFailed(false)

			await Share.share({ url, message: url })
		} catch {
			setShareFailed(true)
		}
	}

	let message: string | null = null

	if (player.failedId === sound.id) {
		message = t("common.sound.playError")
	} else if (controls.feedback.failedId === sound.id) {
		message = t("common.sound.feedbackError")
	} else if (shareFailed) {
		message = t("common.sound.shareError")
	}

	return (
		<View>
			<PressableSurface
				accessibilityLabel={timeLabel}
				accessibilityHint={url ? t("common.sound.share") : undefined}
				onPress={() => onPress?.()}
				onLongPress={url ? () => void share() : undefined}
				disabled={!onPress && !url}
				tone="plain"
				depth={0}
				cornerRadius={radius.control}
				contentStyle={[styles.row, highlighted && styles.highlighted]}
			>
				<View style={styles.info}>
					<Copy style={styles.time}>{timeLabel}</Copy>
					{mimicked ? (
						<View style={styles.judgment}>
							<Tag tone="primary" label={sound.wordName ?? ""} />
							<View
								style={styles.dots}
								accessible
								accessibilityLabel={t("common.sound.similarity", { count: level })}
							>
								{[1, 2, 3].map((index) => (
									<View
										key={index}
										style={[styles.dot, index <= level && styles.dotOn]}
									/>
								))}
							</View>
						</View>
					) : null}
					{sound.judgment === null ? <Tag label={t("common.sound.analyzing")} /> : null}
				</View>
				{heard ? (
					<View style={styles.feedback}>
						<IconButton
							icon={feedback === "up" ? "thumbUpFill" : "thumbUp"}
							label={t("common.sound.correct")}
							variant={feedback === "up" ? "accent" : "muted"}
							size="small"
							onPress={() => controls.feedback.choose(sound.id, "up")}
						/>
						<IconButton
							icon={feedback === "down" ? "thumbDownFill" : "thumbDown"}
							label={t("common.sound.wrong")}
							variant={feedback === "down" ? "plain" : "muted"}
							size="small"
							onPress={() => controls.feedback.choose(sound.id, "down")}
						/>
					</View>
				) : null}
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
						if (url) {
							player.toggle(sound.id, url)
						}
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
	highlighted: {
		backgroundColor: colors.orangeSelected,
		borderWidth: 2,
		borderColor: colors.orange,
		paddingHorizontal: 10,
	},
	info: { flex: 1, minWidth: 0, gap: 6 },
	time: {
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	judgment: { flexDirection: "row", alignItems: "center", gap: 8 },
	dots: { flexDirection: "row", gap: 3 },
	dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.border },
	dotOn: { backgroundColor: colors.orange },
	feedback: { flexDirection: "row" },
})
