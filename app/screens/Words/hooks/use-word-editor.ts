import { useFocusEffect, useNavigation, usePreventRemove } from "@react-navigation/native"
import {
	AudioModule,
	RecordingPresets,
	setAudioModeAsync,
	useAudioPlayer,
	useAudioPlayerStatus,
	useAudioRecorder,
	useAudioRecorderState,
} from "expo-audio"
import { File } from "expo-file-system"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useUserWordCount } from "@/hooks/use-app-data"
import { reportError, setUserProperties, track } from "@/services/telemetry/client"
import { saveWord } from "@/services/words/library"
import type { Word } from "@/types/word"
const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true }

export function useWordEditor() {
	const { t } = useTranslation()
	const userWordCount = useUserWordCount()
	const navigation = useNavigation()
	const [label, setLabel] = useState("")
	const [category, setCategory] = useState<Word["tag"]>("greeting")
	const [recorded, setRecorded] = useState<{ uri: string; duration: number } | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [saved, setSaved] = useState(false)
	const inFlight = useRef(false)
	const savedWord = useRef(false)
	const elapsedMilliseconds = useRef(0)
	const retryCount = useRef(0)
	const finishedRecordingUri = useRef<string | null>(null)
	const player = useAudioPlayer(null, { keepAudioSessionActive: true })
	const playerStatus = useAudioPlayerStatus(player)
	const recorder = useAudioRecorder(recordingOptions, (status) => {
		if (status.hasError) {
			setError(t("words.recordingError"))
		} else if (status.isFinished && status.url) {
			finishRecording(status.url, elapsedMilliseconds.current)
		}
	})
	const recordingState = useAudioRecorderState(recorder, 80)

	elapsedMilliseconds.current = recordingState.durationMillis
	usePreventRemove(busy, () => {})
	useEffect(() => {
		if (!recordingState.isRecording && recordingState.mediaServicesDidReset) {
			setError(t("words.recordingError"))
		}
	}, [recordingState.isRecording, recordingState.mediaServicesDidReset, t])
	useEffect(() => {
		if (saved && !busy) {
			navigation.goBack()
		}
	}, [saved, busy, navigation])

	useFocusEffect(
		useCallback(
			() => () => {
				try {
					player.pause()

					if (recorder.getStatus().isRecording) {
						void recorder
							.stop()
							.catch((cause) => reportError(cause, "recording_cleanup"))
					}
				} catch (cause) {
					reportError(cause, "recording_cleanup")
				}

				void setAudioModeAsync({
					allowsRecording: false,
					shouldPlayInBackground: false,
					allowsBackgroundRecording: false,
				}).catch((cause) => reportError(cause, "recording_cleanup"))
			},
			[player, recorder],
		),
	)

	function finishRecording(uri: string, milliseconds: number) {
		if (finishedRecordingUri.current === uri) {
			return
		}

		finishedRecordingUri.current = uri
		const duration = Math.min(60_000, Math.max(0, milliseconds))

		setRecorded({ uri, duration })

		track("word_recording_finished", {
			word_name: label.trim(),
			recording_duration_ms: duration,
			retry_count: retryCount.current,
		})
	}

	async function toggleRecording() {
		if (inFlight.current) {
			return
		}

		inFlight.current = true
		setBusy(true)
		setError(null)

		try {
			player.pause()

			if (recordingState.isRecording) {
				const duration = recorder.getStatus().durationMillis

				await recorder.stop()

				if (recorder.uri) {
					finishRecording(recorder.uri, duration)
				}
			} else {
				const permission = await AudioModule.requestRecordingPermissionsAsync()

				if (!permission.granted) {
					setError(t("words.microphoneDenied"))

					return
				}

				await setAudioModeAsync({
					allowsRecording: true,
					playsInSilentMode: true,
					interruptionMode: "doNotMix",
					shouldPlayInBackground: false,
					allowsBackgroundRecording: false,
				})
				await recorder.prepareToRecordAsync(recordingOptions)

				if (finishedRecordingUri.current) {
					retryCount.current++
				}

				setRecorded(null)
				elapsedMilliseconds.current = 0
				recorder.record({ forDuration: 60 })
				track("word_recording_started", { word_name: label.trim() })
			}
		} catch {
			setError(t("words.recordingError"))
		} finally {
			inFlight.current = false
			setBusy(false)
		}
	}

	async function preview() {
		if (!recorded) {
			return
		}

		try {
			if (playerStatus.playing) {
				player.pause()

				return
			}

			await setAudioModeAsync({
				allowsRecording: false,
				playsInSilentMode: true,
				shouldPlayInBackground: false,
				interruptionMode: "doNotMix",
			})
			player.replace({ uri: recorded.uri })
			player.play()
		} catch {
			setError(t("words.playbackError"))
		}
	}

	async function save() {
		if (
			inFlight.current ||
			savedWord.current ||
			recordingState.isRecording ||
			!label.trim() ||
			!recorded
		) {
			return
		}

		inFlight.current = true
		setBusy(true)
		setError(null)

		let word: Word

		try {
			player.pause()
			word = await saveWord({ label, tag: category, recordingUri: recorded.uri })
		} catch (cause) {
			inFlight.current = false
			setBusy(false)
			reportError(cause, "word_save")
			Alert.alert(t("words.saveErrorTitle"), t("words.saveError"))

			return
		}

		savedWord.current = true
		setSaved(true)
		inFlight.current = false
		setBusy(false)

		let size: number | undefined

		try {
			const bytes = new File(recorded.uri).size

			size = Number.isFinite(bytes) && bytes >= 0 ? bytes : undefined
		} catch (cause) {
			reportError(cause, "word_audio_size")
		}

		try {
			track("word_added", {
				word_id: word.id,
				word_name: word.label,
				category,
				registration_method: "voice_recording",
				recording_duration_ms: recorded.duration,
				...(size === undefined ? {} : { audio_size_bytes: size }),
			})
			setUserProperties({
				total_words_registered: userWordCount + 1,
			})
		} catch (cause) {
			reportError(cause, "word_analytics")
		}
	}

	const saveDisabled = !label.trim() || !recorded || recordingState.isRecording

	return {
		label,
		setLabel,
		category,
		setCategory,
		recorded,
		error,
		busy,
		recordingState,
		playing: playerStatus.playing,
		playbackSeconds: playerStatus.currentTime,
		toggleRecording,
		preview,
		save,
		saveDisabled,
	}
}
