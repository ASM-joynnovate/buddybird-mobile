import { type ReactElement, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { useLegacyUpload } from "@/hooks/use-legacy-upload"
import { screen } from "@/services/telemetry/client"
import { viewOnboardingStep } from "@/services/telemetry/onboarding"
import { colors } from "@/theme"

export function LegacyUploadScreen(): ReactElement {
	const { t } = useTranslation()

	const upload = useLegacyUpload()

	useEffect(() => {
		screen("LegacyUpload")
		viewOnboardingStep("legacy_upload")
	}, [])

	return (
		<Screen scroll={false}>
			<View style={styles.content}>
				{upload.failed ? (
					<>
						<Copy accessibilityRole="alert" style={styles.message}>
							{t("entry.legacy.error")}
						</Copy>
						<Button label={t("common.retry")} onPress={upload.retry} />
						<Button
							label={t("entry.legacy.skip")}
							variant="secondary"
							onPress={upload.skip}
						/>
					</>
				) : (
					<>
						<ActivityIndicator color={colors.orange} />
						<Copy style={styles.message}>{t("entry.legacy.uploading")}</Copy>
					</>
				)}
			</View>
			<Dialog
				visible={upload.asking}
				title={t("entry.legacy.askTitle")}
				onClose={() => {}}
				footer={
					<View style={ui.actions}>
						<Button
							label={t("entry.legacy.skip")}
							variant="secondary"
							compact
							onPress={upload.skip}
							style={ui.action}
						/>
						<Button
							label={t("entry.legacy.add")}
							compact
							onPress={upload.add}
							style={ui.action}
						/>
					</View>
				}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: { flex: 1, justifyContent: "center", gap: 16, padding: 24 },
	message: { textAlign: "center" },
})
