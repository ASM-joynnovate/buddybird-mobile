import { FeedbackDialog } from "@/components/dialogs/feedback-dialog"
import { UpdateDialog } from "@/components/dialogs/update-dialog"
import { useAccountServices } from "@/hooks/use-account-services"
import { useFeedbackForm } from "@/hooks/use-feedback-form"
import { useFeedbackPrompt } from "@/hooks/use-feedback-prompt"
import { useUpdatePrompt } from "@/hooks/use-update-prompt"
import { useFeedbackStore } from "@/stores/feedback"

export function AppRuntime() {
	useAccountServices()

	const feedback = useFeedbackStore()

	const {
		decision,
		updateVisible,
		updatesSettled,
		storeOpening,
		acceptUpdate,
		dismissUpdatePrompt,
	} = useUpdatePrompt()

	const feedbackPrompt = useFeedbackPrompt(updatesSettled, updateVisible)
	const feedbackForm = useFeedbackForm(feedback.source ?? "profile", feedback.close)

	return (
		<>
			<UpdateDialog
				visible={updateVisible}
				decision={decision}
				pending={storeOpening}
				onAccept={acceptUpdate}
				onDismiss={dismissUpdatePrompt}
			/>
			<FeedbackDialog
				visible={(feedback.source !== null || feedbackPrompt.visible) && !updateVisible}
				prompt={feedbackPrompt.visible ? feedbackPrompt : undefined}
				form={feedbackForm}
			/>
		</>
	)
}
