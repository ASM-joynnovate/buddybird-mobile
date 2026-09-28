import { useAnalyticsUser } from '@/hooks/use-analytics-user';
import { useDeviceRegistration } from '@/hooks/use-device-registration';
import { useFeedbackForm } from '@/hooks/use-feedback-form';
import { useFeedbackPrompt } from '@/hooks/use-feedback-prompt';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { useUpdatePrompt } from '@/hooks/use-update-prompt';

import { useFeedbackStore } from '@/stores/feedback';

import { FeedbackDialog } from '@/components/dialogs/feedback-dialog';
import { UpdateDialog } from '@/components/dialogs/update-dialog';

export function AppRuntime() {
	const feedback = useFeedbackStore();

	const deviceRegistered = useDeviceRegistration();

	usePushRegistration(deviceRegistered);
	useAnalyticsUser();

	const { decision, updateVisible, updatesSettled, storeOpening, acceptUpdate, dismissUpdatePrompt } =
		useUpdatePrompt();

	const feedbackPrompt = useFeedbackPrompt(updatesSettled, updateVisible);

	const feedbackForm = useFeedbackForm(feedback.openedFrom ?? 'profile', feedback.closeFeedback);

	return (
		<>
			{/*업데이트 안내 다이얼로그*/}
			<UpdateDialog
				visible={updateVisible}
				decision={decision}
				pending={storeOpening}
				onAccept={acceptUpdate}
				onDismiss={dismissUpdatePrompt}
			/>

			{/*의견 다이얼로그*/}
			<FeedbackDialog
				visible={(feedback.openedFrom !== null || feedbackPrompt.visible) && !updateVisible}
				prompt={feedbackPrompt.visible ? feedbackPrompt : undefined}
				form={feedbackForm}
			/>
		</>
	);
}
