import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { TextButton } from "@/components/ui/header"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { apiErrorMessage } from "@/lib/api"
import { signOutToAnonymous, withdrawAccount } from "@/services/auth/session"
import { useAccountStore } from "@/stores/account"
import { colors } from "@/theme"

type Open = "signOut" | "withdraw" | null

interface Props {
	onSignIn(): void
}

export function AccountActions({ onSignIn }: Props) {
	const { t } = useTranslation()

	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const busy = useRef(false)

	const [open, setOpen] = useState<Open>(null)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function show(next: Open) {
		setError(null)
		setOpen(next)
	}

	async function run(action: () => Promise<void>, failure: (reason: unknown) => string) {
		if (busy.current) {
			return
		}

		busy.current = true

		setPending(true)
		setError(null)

		try {
			await action()
		} catch (reason) {
			setError(failure(reason))
		} finally {
			busy.current = false

			setPending(false)
		}
	}

	return (
		<View>
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t("settings.account.title")}
			</Copy>
			<View style={styles.buttons}>
				{isAnonymous ? (
					<TextButton label={t("auth.signIn")} onPress={onSignIn} />
				) : (
					<>
						<TextButton
							label={t("settings.account.signOut")}
							tone="muted"
							onPress={() => show("signOut")}
						/>
						<TextButton
							label={t("settings.account.withdraw")}
							tone="muted"
							onPress={() => show("withdraw")}
						/>
					</>
				)}
			</View>
			<ConfirmDialog
				visible={open === "signOut"}
				title={t("settings.signOutDialog.title")}
				message={t("settings.signOutDialog.message")}
				confirmLabel={t("settings.signOutDialog.confirm")}
				cancelLabel={t("common.cancel")}
				busy={pending}
				error={error}
				onConfirm={() => void run(signOutToAnonymous, () => t("auth.signOutError"))}
				onClose={() => show(null)}
			/>
			<ConfirmDialog
				visible={open === "withdraw"}
				title={t("settings.withdrawDialog.title")}
				message={t("settings.withdrawDialog.message")}
				confirmLabel={t("settings.withdrawDialog.confirm")}
				cancelLabel={t("common.cancel")}
				busy={pending}
				error={error}
				onConfirm={() => void run(withdrawAccount, (reason) => apiErrorMessage(reason, t))}
				onClose={() => show(null)}
			>
				<Copy style={styles.line}>{t("settings.withdrawDialog.line")}</Copy>
			</ConfirmDialog>
		</View>
	)
}

const styles = StyleSheet.create({
	buttons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
	line: { color: colors.muted },
})
