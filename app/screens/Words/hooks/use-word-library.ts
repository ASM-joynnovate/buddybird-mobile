import { useFocusEffect } from "@react-navigation/native"

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio"

import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Alert } from "react-native"

import { useUserWordCount, useVisibleWords } from "@/hooks/use-app-data"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { filters } from "@/screens/Words/filters"
import { resolvePreviewAudio } from "@/services/media/audio"
import { screen, setUserProperties, track } from "@/services/telemetry/client"
import { removeWord } from "@/services/words/library"
import { Word } from "@/types/word"

export function useWordLibrary() {
	const { t } = useTranslation()

	const userWordCount = useUserWordCount()
	const locale = useDeviceSetting("locale")
	const words = useVisibleWords(locale)

	const player = useAudioPlayer(null, { keepAudioSessionActive: true })
	const status = useAudioPlayerStatus(player)
	const [filter, setFilter] = useState<(typeof filters)[number]>("all")
	const [playingId, setPlayingId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const previewRequestId = useRef(0)
	const isFocused = useRef(false)
	const wordCount = useRef(words.length)

	wordCount.current = words.length
	const filteredWords = filter === "all" ? words : words.filter((word) => word.tag === filter)

	useFocusEffect(
		useCallback(() => {
			isFocused.current = true
			screen("words")
			track("word_library_opened", { total_words_count: wordCount.current })

			return () => {
				isFocused.current = false
				previewRequestId.current++
				player.pause()
				setPlayingId(null)
			}
		}, [player]),
	)
	useEffect(() => {
		if (status.didJustFinish) {
			setPlayingId(null)
		}
	}, [status.didJustFinish])

	const preview = useCallback(
		async (word: Word) => {
			const requestId = ++previewRequestId.current

			setError(null)

			if (playingId === word.id && status.playing) {
				player.pause()
				setPlayingId(null)
				track("word_library_preview_played", {
					word_id: word.id,
					word_name: word.label,
					source_type: word.sourceType,
					action: "stop",
				})

				return
			}

			player.pause()

			try {
				const uri = await resolvePreviewAudio(word)

				if (requestId !== previewRequestId.current || !isFocused.current) {
					return
				}

				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: false,
					shouldPlayInBackground: false,
					interruptionMode: "doNotMix",
				})

				if (requestId !== previewRequestId.current || !isFocused.current) {
					return
				}

				player.replace({ uri })
				player.play()
				setPlayingId(word.id)

				track("word_library_preview_played", {
					word_id: word.id,
					word_name: word.label,
					source_type: word.sourceType,
					action: "play",
				})
			} catch {
				setError(t("words.playbackError"))
				setPlayingId(null)
			}
		},
		[player, playingId, status.playing, t],
	)

	const deleteWord = useCallback(
		(word: Word) => {
			try {
				if (playingId === word.id) {
					previewRequestId.current++
					player.pause()
					setPlayingId(null)
				}

				const metrics = removeWord(word.id)

				track("word_removed", {
					word_id: word.id,
					word_name: word.label,
					lifetime_practice_count: metrics.lifetime_practice_count,
					lifetime_practice_duration_ms: metrics.lifetime_practice_duration_ms,
				})
				setUserProperties({
					total_words_registered: userWordCount - 1,
				})
			} catch {
				setError(t("words.removeError"))
			}
		},
		[player, playingId, t, userWordCount],
	)

	const confirmDelete = useCallback(
		(word: Word) => {
			previewRequestId.current++
			player.pause()
			setPlayingId(null)

			Alert.alert(t("words.confirmDelete", { word: word.label }), undefined, [
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => deleteWord(word),
				},
			])
		},
		[deleteWord, player, t],
	)

	function changeFilter(next: typeof filter) {
		if (next === filter) {
			return
		}

		track("word_library_filter_changed", {
			from: filter,
			to: next,
			visible_words_count:
				next === "all" ? words.length : words.filter((word) => word.tag === next).length,
		})
		previewRequestId.current++

		if (
			playingId &&
			next !== "all" &&
			words.find((word) => word.id === playingId)?.tag !== next
		) {
			player.pause()
			setPlayingId(null)
		}

		setFilter(next)
	}

	return {
		filter,
		changeFilter,
		filteredWords,
		error,
		playingId,
		playing: status.playing,
		preview,
		confirmDelete,
	}
}
