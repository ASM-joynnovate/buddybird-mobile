import { useEffect, useRef, useState } from "react"

import { AppState } from "react-native"

import { screen, track } from "@/services/telemetry/client"
import type { ProfileDraft, ProfileOnboarding } from "@/types/profile"

export function useOnboarding() {
	const [draft, setDraft] = useState<ProfileDraft>()
	const [step, setStep] = useState<"welcome" | "profile">("welcome")
	const attempt = useRef({
		startedAt: Date.now(),
		stepAt: Date.now(),
		started: false,
		completed: false,
		abandoned: false,
		pickerOpen: false,
		step,
	})

	useEffect(() => {
		screen(step === "welcome" ? "onboarding_welcome" : "onboarding_profile")
	}, [step])
	useEffect(() => {
		if (!attempt.current.started) {
			attempt.current.started = true
			track("onboarding_started", {})
		}
	}, [])
	useEffect(() => {
		let previous = AppState.currentState
		const subscription = AppState.addEventListener("change", (next) => {
			const current = attempt.current

			if (
				next === "background" &&
				previous !== "background" &&
				current.started &&
				!current.completed &&
				!current.abandoned &&
				!current.pickerOpen
			) {
				current.abandoned = true
				track("onboarding_abandoned", {
					last_step: current.step,
					last_step_duration_ms: Date.now() - current.stepAt,
				})
			}

			previous = next
		})

		return () => {
			subscription.remove()
		}
	}, [])

	function changeStep(next: typeof step) {
		attempt.current.step = next
		attempt.current.stepAt = Date.now()
		setStep(next)
	}

	function begin() {
		if (attempt.current.step !== "welcome") {
			return
		}

		track("onboarding_step_completed", {
			step: "welcome",
			duration_ms: Date.now() - attempt.current.stepAt,
		})
		changeStep("profile")
	}

	const profile: ProfileOnboarding = {
		draft,
		onDraft: setDraft,
		onBack: () => changeStep("welcome"),
		onPhotoPickerChange: (open) => {
			attempt.current.pickerOpen = open
		},
		onComplete: () => {
			if (attempt.current.completed) {
				return
			}

			attempt.current.completed = true
			track("onboarding_step_completed", {
				step: "profile",
				duration_ms: Date.now() - attempt.current.stepAt,
			})
			track("onboarding_completed", {
				total_duration_ms: Date.now() - attempt.current.startedAt,
			})
		},
	}

	return { step, begin, profile }
}
