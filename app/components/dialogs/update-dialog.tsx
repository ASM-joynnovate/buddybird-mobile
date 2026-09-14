import { useState } from "react"

import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { Copy } from "@/components/ui/text"

export function UpdateDialog({
	visible,
	latestVersion,
	notes,
	forced,
	onAccept,
	onDismiss,
	pending = false,
}: {
	visible: boolean
	latestVersion: string
	notes: string[]
	forced: boolean
	onAccept(): Promise<void> | void
	onDismiss(): void
	pending?: boolean
}) {
	const { t } = useTranslation()

	const [busy, setBusy] = useState(false)
	const [error, setError] = useState(false)
	const blocked = busy || pending

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
			title={t(forced ? "update.required" : "update.title")}
		>
			<Copy style={styles.body}>
				{t(forced ? "update.requiredBody" : "update.body", { version: latestVersion })}
			</Copy>
			{notes.map((note, index) => (
				<Copy key={`${index}-${note}`} style={styles.note}>
					{note}
				</Copy>
			))}
			<InlineError message={error ? t("update.error") : null} />

			<View style={styles.actions}>
				{!forced ? (
					<Button
						testID="update-later"
						label={t("update.later")}
						variant="secondary"
						disabled={blocked}
						onPress={onDismiss}
						style={styles.action}
					/>
				) : null}
				<Button
					testID="update-open-store"
					label={t("update.accept")}
					loading={blocked}
					onPress={() => void accept()}
					style={styles.action}
				/>
			</View>
		</Dialog>
	)
}

const styles = StyleSheet.create({
	body: { fontSize: 17, lineHeight: 27 },
	actions: { flexDirection: "row", gap: 12, marginTop: 26 },
	action: { flex: 1 },
	note: { marginTop: 12, lineHeight: 24 },
})
