import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { ui } from "@/components/ui/styles"
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
		<Dialog
			visible={visible}
			title={t("session.confirmEndTitle")}
			onClose={onClose}
			footer={
				<View style={[ui.actions, styles.actions]}>
					<Button
						testID="session-exit-continue"
						label={t("session.continueLearning")}
						variant="secondary"
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						testID="session-exit-end"
						label={t("session.endLabel")}
						onPress={onEnd}
						style={ui.action}
					/>
				</View>
			}
		>
			<Copy>{t("session.confirmEndMessage")}</Copy>
		</Dialog>
	)
}

const styles = StyleSheet.create({
	actions: { marginTop: 0 },
})
