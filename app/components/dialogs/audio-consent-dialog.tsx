import { useState } from "react"

import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { ui } from "@/components/ui/styles"
import { InlineError } from "@/components/ui/inline-error"
import { Copy } from "@/components/ui/text"

export function AudioConsentDialog({
	visible,
	onDecision,
}: {
	visible: boolean
	onDecision(status: "granted" | "denied"): Promise<void> | void
}) {
	const { t } = useTranslation()

	const [busy, setBusy] = useState(false)
	const [error, setError] = useState(false)

	async function decide(status: "granted" | "denied") {
		if (busy) {
			return
		}

		setBusy(true)
		setError(false)

		try {
			await onDecision(status)
		} catch {
			setError(true)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Dialog
			visible={visible}
			onClose={() => {}}
			title={t("consent.title")}
			footer={
				<View style={[ui.actions, styles.actions]}>
					<Button
						testID="audio-consent-decline"
						label={t("consent.decline")}
						variant="secondary"
						disabled={busy}
						onPress={() => void decide("denied")}
						style={ui.action}
					/>
					<Button
						testID="audio-consent-accept"
						label={t("consent.accept")}
						loading={busy}
						onPress={() => void decide("granted")}
						style={ui.action}
					/>
				</View>
			}
		>
			<Copy style={styles.body}>{t("consent.body")}</Copy>
			<InlineError message={error ? t("consent.error") : null} />
		</Dialog>
	)
}

const styles = StyleSheet.create({
	body: { fontSize: 17, lineHeight: 27 },
	actions: { marginTop: 0 },
})
