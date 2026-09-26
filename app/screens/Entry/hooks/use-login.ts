import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { linkAccount, switchAccount } from "@/services/auth/sign-in"
import type { LoginProvider } from "@/types/account"

export type LoginAttempt = { provider: LoginProvider; pending: boolean }

export type LoginState = {
	attempt: LoginAttempt | null
	merging: LoginProvider | null
	signIn(provider: LoginProvider): void
	merge(): void
	cancelMerge(): void
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
	const [merging, setMerging] = useState<LoginProvider | null>(null)

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
				Alert.alert(t("auth.signInError"))
			}
		} finally {
			busy.current = false

			setAttempt({ provider, pending: false })
		}
	}

	async function connect(provider: LoginProvider) {
		const result = await linkAccount(provider)

		if (result === "exists" && entry) {
			await switchAccount(provider, false)
		} else if (result === "exists") {
			setMerging(provider)
		} else if (result === "linked" && !entry) {
			onDone()
		}
	}

	async function mergeInto(provider: LoginProvider) {
		if (await switchAccount(provider, true)) {
			onDone()
		}
	}

	return {
		attempt,
		merging,
		signIn: (provider) => void run(provider, () => connect(provider)),
		merge: () => {
			if (merging) {
				setMerging(null)

				void run(merging, () => mergeInto(merging))
			}
		},
		cancelMerge: () => setMerging(null),
	}
}
