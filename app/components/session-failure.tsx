import { useTranslation } from "react-i18next"

import { Linking, StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { reportError } from "@/services/telemetry/client"
import type { SessionFailure } from "@modules/session-audio-engine/types"

export function SessionFailureNotice({
	failure,
	onChooseWord,
}: {
	failure: SessionFailure | null
	onChooseWord?(): void
}) {
	const { t } = useTranslation()

	if (!failure) {
		return null
	}

	return (
		<View>
			<InlineError message={t(`session.failure.${failure.code}`)} />
			{failure.code === "permission-denied" ? (
				<Button
					testID="session-open-settings"
					label={t("session.openSettings")}
					variant="secondary"
					onPress={() =>
						void Linking.openSettings().catch((error) =>
							reportError(error, "microphone_settings"),
						)
					}
					style={styles.action}
				/>
			) : null}
			{failure.code === "audio-source-unavailable" && onChooseWord ? (
				<Button
					label={t("session.chooseWord")}
					variant="secondary"
					onPress={onChooseWord}
					style={styles.action}
				/>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({ action: { marginTop: 12 } })
