import { useFocusEffect } from "@react-navigation/native"

import { useCallback, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import { Alert, Linking } from "react-native"

import { useProfile, useVisibleWords } from "@/hooks/use-app-data"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { useSession } from "@/hooks/use-session"
import { choices, presetMinutes } from "@/screens/Learning/durations"
import { sessionFailure } from "@/services/session/failure"
import { customTiming, presetTiming } from "@/services/session/timing"
import { reportError, screen } from "@/services/telemetry/client"
import type { SessionFailure } from "@modules/session-audio-engine/types"

export function useLearningSetup() {
	const { t } = useTranslation()
	const profile = useProfile()
	const session = useSession()

	const locale = useDeviceSetting("locale")
	const words = useVisibleWords(locale)
	const [wordId, setWordId] = useState<string | undefined>()
	const [choice, setChoice] = useState<(typeof choices)[number]>("medium")
	const [customMinutes, setCustomMinutes] = useState(25)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<SessionFailure | null>(null)
	const starting = useRef(false)
	const word = words.find((item) => item.id === wordId) ?? words[0]
	const timing =
		choice === "custom" ? customTiming(customMinutes) : presetTiming(presetMinutes[choice])

	const hasZeroDuration = timing.totalDurationSeconds === 0
	const startDisabled = !word || !profile || hasZeroDuration
	const errorMessage = !profile
		? t("storage.profileUnavailable")
		: hasZeroDuration
			? t("learning.invalid")
			: null

	useFocusEffect(
		useCallback(() => {
			screen("session_setup")
		}, []),
	)

	function choose(next: typeof choice) {
		setChoice(next)

		if (next === "custom") {
			setCustomMinutes(25)
		}

		setError(null)
	}

	function changeCustomHours(nextHours: number) {
		setCustomMinutes(nextHours * 60 + (customMinutes % 60))
	}

	function changeCustomMinutes(nextMinutes: number) {
		setCustomMinutes(Math.floor(customMinutes / 60) * 60 + nextMinutes)
	}

	async function start() {
		if (starting.current || startDisabled || !word) {
			return
		}

		starting.current = true
		setBusy(true)
		setError(null)

		try {
			await session.start(word.id, timing)
		} catch (cause) {
			const failure = sessionFailure(cause)

			if (failure.code === "permission-denied") {
				Alert.alert(t("learning.microphoneTitle"), t("learning.microphoneMessage"), [
					{ text: t("common.cancel"), style: "cancel" },
					{
						text: t("learning.openSettings"),
						onPress: () => {
							void Linking.openSettings().catch((error) =>
								reportError(error, "microphone_settings"),
							)
						},
					},
				])
			} else {
				setError(failure)
			}
		} finally {
			starting.current = false
			setBusy(false)
		}
	}

	const selectWord = useCallback((id: string) => {
		setWordId(id)
		setError(null)
	}, [])

	return {
		locale,
		words,
		word,
		setWordId: selectWord,
		choice,
		choose,
		timing,
		customMinutes,
		changeCustomHours,
		changeCustomMinutes,
		start,
		startDisabled,
		errorMessage,
		failure: error,
		busy,
	}
}
