import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import type { UpdateDecision } from "@/types/update"

interface Props {
	visible: boolean
	decision: UpdateDecision
	pending: boolean
	onAccept(): Promise<void> | void
	onDismiss(): void
}

export function UpdateDialog({ visible, decision, pending, onAccept, onDismiss }: Props) {
	const { t } = useTranslation()

	const [busy, setBusy] = useState(false)
	const [error, setError] = useState(false)

	const blocked = busy || pending
	const forced = decision?.forced ?? false

	async function accept() {
		setBusy(true)
		setError(false)

		try {
			await onAccept()
		} catch {
			setError(true)
		} finally {
			setBusy(false)
		}
	}

	function dismiss() {
		if (!forced && !blocked) {
			onDismiss()
		}
	}

	return (
		<Dialog
			visible={visible}
			onClose={dismiss}
			title={t(forced ? "app.update.required" : "app.update.title")}
			footer={
				<View style={[ui.actions, styles.actions]}>
					{!forced ? (
						<Button
							testID="update-later"
							label={t("app.update.later")}
							variant="secondary"
							disabled={blocked}
							onPress={onDismiss}
							style={ui.action}
						/>
					) : null}
					<Button
						testID="update-open-store"
						label={t("app.update.accept")}
						loading={blocked}
						onPress={() => void accept()}
						style={ui.action}
					/>
				</View>
			}
		>
			<Copy style={styles.body}>
				{t(forced ? "app.update.requiredBody" : "app.update.body", {
					version: decision?.latestVersion ?? "",
				})}
			</Copy>
			{(decision?.notes ?? []).map((note, index) => (
				<Copy key={`${index}-${note}`} style={styles.note}>
					{note}
				</Copy>
			))}
			<InlineError message={error ? t("app.update.error") : null} />
		</Dialog>
	)
}

const styles = StyleSheet.create({
	body: { fontSize: 17, lineHeight: 27 },
	actions: { marginTop: 0 },
	note: { marginTop: 12, lineHeight: 24 },
})
