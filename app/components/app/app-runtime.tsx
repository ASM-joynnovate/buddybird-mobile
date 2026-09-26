import { FeedbackDialog } from "@/components/dialogs/feedback-dialog"
import { UpdateDialog } from "@/components/dialogs/update-dialog"
import { useAccountServices } from "@/hooks/use-account-services"
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
			<FeedbackDialog
				visible={(feedback.source !== null || feedbackPrompt.visible) && !updateVisible}
				prompt={feedbackPrompt.visible ? feedbackPrompt : undefined}
				source={feedback.source ?? "profile"}
				onClose={feedback.close}
			/>
		</>
	)
}
