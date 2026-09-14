import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "@/components/ui/text"

export function SessionExitDialog({
	visible,
	onClose,
	onEnd,
}: {
	visible: boolean
	onClose(): void
	onEnd(): void
}) {
	const { t } = useTranslation()

	return (
		<Dialog visible={visible} title={t("session.confirmEndTitle")} onClose={onClose}>
			<Copy>{t("session.confirmEndMessage")}</Copy>
			<View style={styles.actions}>
				<Button
					testID="session-exit-continue"
					label={t("common.cancel")}
					variant="secondary"
					onPress={onClose}
					style={styles.action}
				/>
				<Button
					testID="session-exit-end"
					label={t("session.endLabel")}
					onPress={onEnd}
					style={styles.action}
				/>
			</View>
		</Dialog>
	)
}

const styles = StyleSheet.create({
	actions: { flexDirection: "row", gap: 12, marginTop: 24 },
	action: { flex: 1 },
})
