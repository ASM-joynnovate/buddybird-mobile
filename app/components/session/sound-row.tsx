import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Share, StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import { soundFeedbackMutationOptions, soundFeedbackQueryOptions } from "@/hooks/apis/mocks"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import type { TimelineSound } from "@/mocks/types"
import { colors, font, radius } from "@/theme"

interface Props {
	sound: TimelineSound
	timeLabel: string
	player: SoundPlayer
	highlighted?: boolean
	onPress?(): void
}

export function similarityLevel(score: number): 1 | 2 | 3 {
	if (score < 0.6) {
		return 1
	}

	return score < 0.8 ? 2 : 3
}

export function SoundRow({ sound, timeLabel, player, highlighted, onPress }: Props) {
	const { t } = useTranslation()

	const savedFeedback = useQuery(soundFeedbackQueryOptions()).data?.find(
		(item) => item.sound_id === sound.id,
	)?.feedback

	const saving = useIdempotentMutation(soundFeedbackMutationOptions())

	const [chosenFeedback, setChosenFeedback] = useState<"up" | "down" | null>(null)
	const [shareFailed, setShareFailed] = useState(false)

	const feedback = chosenFeedback ?? savedFeedback ?? null
	const playing = player.playingId === sound.id
	const heard = player.finishedIds.has(sound.id) || feedback !== null
	const mimicked = Boolean(sound.judgment?.word_id)
	const score = sound.analysis?.score
	const level = mimicked && score != null ? similarityLevel(score) : 0
	const url = sound.audio.url

	function choose(value: "up" | "down") {
		const previous = chosenFeedback

		setChosenFeedback(value)

		saving.mutate(
			{ soundId: sound.id, feedback: value },
			{ onError: () => setChosenFeedback(previous) },
		)
	}

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
	} else if (saving.isError) {
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
							color={feedback === "up" ? colors.orange : colors.muted}
							size={44}
							iconSize={20}
							onPress={() => choose("up")}
						/>
						<IconButton
							icon={feedback === "down" ? "thumbDownFill" : "thumbDown"}
							label={t("common.sound.wrong")}
							color={feedback === "down" ? colors.text : colors.muted}
							size={44}
							iconSize={20}
							onPress={() => choose("down")}
						/>
					</View>
				) : null}
				<IconButton
					icon={playing ? "pause" : "play"}
					label={
						url
							? t(playing ? "common.sound.stop" : "common.sound.play", {
									time: timeLabel,
								})
							: t("common.sound.expired")
					}
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
