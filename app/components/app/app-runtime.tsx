import { useState } from "react"

import { AudioConsentDialog } from "@/components/dialogs/audio-consent-dialog"
import { FeedbackDialog } from "@/components/dialogs/feedback-dialog"
import { UpdateDialog } from "@/components/dialogs/update-dialog"
import { useAppData } from "@/hooks/use-app-data"
import { useFeedbackDialog } from "@/hooks/use-feedback-dialog"
import { useFeedbackPrompt } from "@/hooks/use-feedback-prompt"
import { useUpdatePrompt } from "@/hooks/use-update-prompt"
import { setUploadConsent } from "@/services/uploads/consent"
import { shouldPromptUploadConsent } from "@/services/uploads/consent-policy"

export function AppRuntime({ telemetryReady }: { telemetryReady: boolean }) {
	const data = useAppData()

	const feedback = useFeedbackDialog()

	const [consentResolved, setConsentResolved] = useState(
		() => !shouldPromptUploadConsent(data.settings.uploadConsent, true),
	)
	const {
		decision,
		updateVisible,
		updatesSettled,
		storeOpening,
		acceptUpdate,
		dismissUpdatePrompt,
	} = useUpdatePrompt(telemetryReady)

	const consentVisible = !!data.profile && updatesSettled && !updateVisible && !consentResolved

	const feedbackPrompt = useFeedbackPrompt(updatesSettled, updateVisible, consentResolved)

	return (
		<>
			<UpdateDialog
				visible={updateVisible}
				latestVersion={decision?.latestVersion ?? ""}
				notes={decision?.notes ?? []}
				forced={decision?.forced ?? false}
				pending={storeOpening}
				onAccept={acceptUpdate}
				onDismiss={dismissUpdatePrompt}
			/>
			<AudioConsentDialog
				visible={consentVisible}
				onDecision={async (status) => {
					await setUploadConsent(status)
					setConsentResolved(true)
				}}
			/>
			<FeedbackDialog
				visible={
					(feedback.source !== null || feedbackPrompt.visible) &&
					!updateVisible &&
					!consentVisible
				}
				prompt={feedbackPrompt.visible ? feedbackPrompt : undefined}
				source={feedback.source ?? "profile"}
				onClose={feedback.close}
			/>
		</>
	)
}
