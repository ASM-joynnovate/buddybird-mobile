import { useTranslation } from "react-i18next"
import { Linking, StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Mascot } from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import type { PermissionDialogState } from "@/hooks/use-permission"
import { reportError } from "@/services/telemetry/client"

export function PermissionDialog({ visible, kind, onClose }: PermissionDialogState) {
	const { t } = useTranslation()

	return (
		<Dialog
			visible={visible}
			title={t("common.permission.title", { name: t(`common.permission.${kind}.name`) })}
			onClose={onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={t("common.close")}
						variant="secondary"
						compact
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={t("common.permission.openSettings")}
						compact
						onPress={() =>
							void Linking.openSettings().catch((error: unknown) =>
								reportError(error, "permission_settings"),
							)
						}
						style={ui.action}
					/>
				</View>
			}
		>
			<View style={styles.body}>
				<Mascot size={88} />
				<Copy style={styles.reason}>{t(`common.permission.${kind}.reason`)}</Copy>
			</View>
		</Dialog>
	)
}

const styles = StyleSheet.create({
	body: { alignItems: "center", gap: 12 },
	reason: { textAlign: "center", lineHeight: 22 },
})
