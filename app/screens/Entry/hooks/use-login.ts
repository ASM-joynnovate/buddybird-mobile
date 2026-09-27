import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { linkAccount, switchAccount } from "@/services/auth/sign-in"
import { reportError } from "@/services/telemetry/client"
import { completeOnboardingStep } from "@/services/telemetry/onboarding"
import type { LoginProvider } from "@/types/account"

type LoginAttempt = { provider: LoginProvider; pending: boolean }

type LoginState = {
	attempt: LoginAttempt | null
	signIn(provider: LoginProvider): void
}

function isAppleCancel(provider: LoginProvider, failure: unknown) {
	return (
		provider === "apple" &&
		failure instanceof Error &&
		"code" in failure &&
		(failure.code === "ERR_REQUEST_CANCELED" || failure.code === "ERR_REQUEST_UNKNOWN")
	)
}

export function useLogin(entry: boolean, onDone: () => void): LoginState {
	const { t } = useTranslation()

	const busy = useRef(false)

	const [attempt, setAttempt] = useState<LoginAttempt | null>(null)

	async function run(provider: LoginProvider, action: () => Promise<void>) {
		if (busy.current) {
			return
		}

		busy.current = true

		setAttempt({ provider, pending: true })

		try {
			await action()
		} catch (failure) {
			if (!isAppleCancel(provider, failure)) {
				reportError(failure, "sign_in")

				Alert.alert(t("auth.signInError"))
			}
		} finally {
			busy.current = false

			setAttempt({ provider, pending: false })
		}
	}

	async function connect(provider: LoginProvider) {
		const result = await linkAccount(provider)

		if (result === "exists") {
			await switchAccount(provider)
		} else if (result === "linked" && !entry) {
			onDone()
		}

		if (entry && result !== "cancelled") {
			completeOnboardingStep("login", { login_method: provider })
		}
	}

	return {
		attempt,
		signIn: (provider) => void run(provider, () => connect(provider)),
	}
}
