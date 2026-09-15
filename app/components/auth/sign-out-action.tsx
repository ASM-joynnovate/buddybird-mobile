import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { useAuth } from "@/context/auth"

export function SignOutAction() {
	const { signOut } = useAuth()
	const { t } = useTranslation()
	const busy = useRef(false)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()

	async function leave() {
		if (busy.current) {
			return
		}

		busy.current = true
		setPending(true)
		setError(undefined)

		try {
			await signOut()
		} catch {
			setError(t("auth.signOutError"))
		} finally {
			busy.current = false
			setPending(false)
		}
	}

	return (
		<View>
			<Button
				testID="auth-sign-out"
				label={t("auth.signOut")}
				variant="secondary"
				loading={pending}
				onPress={() => void leave()}
			/>
			<InlineError message={error} />
		</View>
	)
}
