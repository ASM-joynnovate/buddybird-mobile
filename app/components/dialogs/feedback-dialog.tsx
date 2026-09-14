import { useMutation } from "@tanstack/react-query"

import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { TextField } from "@/components/ui/text-field"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { Copy } from "@/components/ui/text"
import { feedbackMutationOptions } from "@/hooks/apis/feedback"
import { useAppData } from "@/hooks/use-app-data"
import { track } from "@/services/telemetry/client"
import { colors, font, mascot } from "@/theme"

export function FeedbackDialog({
	visible,
	prompt,
	source,
	onClose,
	onSubmitted,
}: {
	visible: boolean
	prompt?: { onDismiss(): void; onWrite(): void }
	source: "profile" | "prompt"
	onClose(): void
	onSubmitted?(): void
}) {
	const { t } = useTranslation()
	const data = useAppData()

	const [message, setMessage] = useState("")
	const mutation = useMutation(feedbackMutationOptions())

	function close() {
		if (mutation.isPending) {
			return
		}

		mutation.reset()
		setMessage("")
		onClose()
	}

	function submit() {
		mutation.mutate(
			{ message: message.trim(), locale: data.settings.locale },
			{
				onSuccess: () => {
					track("feedback_submitted", { source, message_length: message.trim().length })
					setMessage("")
					onSubmitted?.()
				},
			},
		)
	}

	if (mutation.isSuccess) {
		return (
			<Dialog visible={visible} onClose={close} title={t("feedback.sent")}>
				<Image accessible={false} source={mascot} style={styles.promptMascot} />
				<Button
					testID="feedback-thanks-close"
					label={t("common.close")}
					onPress={close}
					style={styles.thanksClose}
				/>
			</Dialog>
		)
	}

	if (prompt) {
		return (
			<Dialog visible={visible} onClose={prompt.onDismiss} title={t("feedback.promptTitle")}>
				<Image accessible={false} source={mascot} style={styles.promptMascot} />
				<Copy style={styles.promptMessage}>{t("feedback.promptMessage")}</Copy>
				<View style={styles.actions}>
					<Button
						testID="feedback-prompt-later"
						label={t("feedback.later")}
						variant="secondary"
						onPress={prompt.onDismiss}
						style={styles.action}
					/>
					<Button
						testID="feedback-prompt-write"
						label={t("feedback.write")}
						onPress={prompt.onWrite}
						style={styles.action}
					/>
				</View>
			</Dialog>
		)
	}

	return (
		<Dialog visible={visible} onClose={close} title={t("feedback.title")}>
			<TextField
				testID="feedback-message"
				accessibilityLabel={t("feedback.title")}
				value={message}
				onChangeText={setMessage}
				maxLength={1000}
				multiline
				editable={!mutation.isPending}
				textAlignVertical="top"
				placeholder={t("feedback.placeholder")}
				style={styles.message}
			/>
			<Copy style={styles.privacy}>{t("feedback.privacy")}</Copy>
			<InlineError message={mutation.isError ? t("feedback.error") : null} />

			<View style={styles.actions}>
				<Button
					label={t("common.cancel")}
					variant="secondary"
					disabled={mutation.isPending}
					onPress={close}
					style={styles.action}
				/>
				<Button
					testID="feedback-send"
					label={t("feedback.send")}
					icon="send"
					disabled={!message.trim()}
					loading={mutation.isPending}
					onPress={submit}
					style={styles.action}
				/>
			</View>
		</Dialog>
	)
}

const styles = StyleSheet.create({
	thanksClose: { marginTop: 26 },
	promptMascot: { width: 96, height: 96, resizeMode: "contain", alignSelf: "center" },
	promptMessage: { fontSize: 17, lineHeight: 27, textAlign: "center", marginTop: 16 },
	actions: { flexDirection: "row", gap: 12, marginTop: 26 },
	action: { flex: 1 },
	message: { height: 160, fontFamily: font.bold, fontSize: 17, lineHeight: 26 },
	privacy: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 12 },
})
