import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { randomUUID } from "expo-crypto"
import type { TFunction } from "i18next"
import { MicIcon, PauseIcon, PlayIcon, SquareIcon } from "lucide-react-native"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenHeader } from "@/components/ui/screen-header"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatTimer } from "@/i18n/format"
import { AudioWaveform } from "@/screens/words/components/audio-waveform"
import { type Recorder, useRecorder } from "@/screens/words/hooks/use-recorder"
import { colors, contentMaxWidth, font } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

const TAKE_ID = "take"

function statusText(recorder: Recorder, t: TFunction): string {
	if (recorder.recording) {
		return t("words.recorder.recording")
	}

	return recorder.take ? t("words.recorder.recorded") : t("words.recorder.ready")
}

export function RecorderScreen(): ReactElement {
	const { t } = useTranslation()

	const insets = useSafeAreaInsets()

	const { params } = useRoute<RouteProp<RootStackParamList, "Recorder">>()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const recorder = useRecorder()

	const player = useSoundPlayer()

	const microphone = usePermission("microphone")

	const { take } = recorder
	const playing = player.playingId === TAKE_ID
	const shownMs = recorder.recording ? recorder.elapsedMs : (take?.durationMs ?? 0)

	async function close() {
		player.stop()

		await recorder.discard()

		navigation.goBack()
	}

	function record() {
		player.stop()

		void microphone.run(() => void recorder.start())
	}

	function add() {
		if (!take) {
			return
		}

		player.stop()

		navigation.popTo("Main", {
			screen: "WordsTab",
			params: {
				screen: "WordEditor",
				params: {
					recorded: { key: randomUUID(), uri: take.uri, durationMs: take.durationMs },
				},
				merge: true,
			},
		})
	}

	return (
		<Screen scroll={false}>
			<View style={[styles.screen, { paddingBottom: insets.bottom + 20 }]}>
				<ScreenHeader
					title={params.wordName || t("words.recorder.newWord")}
					onBack={() => void close()}
					backIcon="close"
				/>
				<View style={styles.center}>
					<AudioWaveform
						color={colors.orange}
						height={96}
						barCount={36}
						fill
						level={recorder.recording ? recorder.level : null}
						animated={playing}
					/>
					<Copy accessibilityRole="timer" style={styles.timer}>
						{formatTimer(shownMs)}
					</Copy>
					<Copy accessibilityLiveRegion="polite" style={styles.status}>
						{statusText(recorder, t)}
					</Copy>
					{take && !recorder.recording ? (
						<IconButton
							icon={playing ? PauseIcon : PlayIcon}
							label={t(playing ? "common.sound.stop" : "words.recorder.play")}
							variant="primary"
							size="large"
							onPress={() => player.toggle(TAKE_ID, take.uri)}
						/>
					) : null}
					<InlineError
						message={
							recorder.problem
								? t(`words.recorder.${recorder.problem}`)
								: player.failedId
									? t("common.sound.playError")
									: null
						}
					/>
				</View>
				{take && !recorder.recording ? (
					<View style={ui.actions}>
						<Button
							label={t("words.recorder.retake")}
							variant="secondary"
							disabled={recorder.busy}
							onPress={record}
							style={ui.action}
						/>
						<Button label={t("words.recorder.add")} onPress={add} style={ui.action} />
					</View>
				) : (
					<View style={styles.control}>
						<IconButton
							icon={recorder.recording ? SquareIcon : MicIcon}
							label={t(
								recorder.recording ? "words.recorder.stop" : "words.recorder.start",
							)}
							variant="primary"
							size="xlarge"
							disabled={recorder.busy}
							onPress={() => (recorder.recording ? void recorder.stop() : record())}
						/>
					</View>
				)}
			</View>
			<PermissionDialog state={microphone.dialog} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: contentMaxWidth,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
	timer: {
		fontFamily: font.black,
		fontSize: 40,
		lineHeight: 48,
		fontVariant: ["tabular-nums"],
	},
	status: { color: colors.muted, textAlign: "center" },
	control: { alignItems: "center" },
})
