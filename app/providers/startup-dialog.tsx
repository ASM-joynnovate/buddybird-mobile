import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getRunningSessionOptions } from '@/hooks/apis/sessions';

import { useUpdatePrompt } from '@/providers/update-dialog';
import { getFeedbackPromptThresholds } from '@/services/remote-config/client';
import { reportError, track } from '@/services/telemetry/client';
import { useAppStore } from '@/stores/app';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useFeedbackStore } from '@/stores/feedback';
import { feedbackThreshold } from '@/utils/feedback';

import FeedbackDialog from '@/components/dialogs/feedback-dialog';

interface Props {
	children: ReactNode;
}

/**
 * 앱 시작 다이얼로그 provider
 * @param children 감싸는 내용
 */
const StartupDialogProvider = ({ children }: Props) => {
	const [promptOpen, setPromptOpen] = useState(false);

	const feedbackPromptOpenRef = useRef(false);

	const { updateVisible, updateCheckSettled } = useUpdatePrompt();

	const { data: parrotListData } = useQuery({ ...getParrotListOptions(), throwOnError: false });
	const { data: runningSessionData } = useQuery({ ...getRunningSessionOptions(), throwOnError: false });

	const splashFinished = useAppStore((state) => state.splashFinished);

	const feedbackPrompt = useDeviceSettingsStore((state) => state.feedbackPrompt);
	const consumeFeedbackPrompt = useDeviceSettingsStore((state) => state.consumeFeedbackPrompt);

	const openedFrom = useFeedbackStore((state) => state.openedFrom);
	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	const sessionActive = runningSessionData != null;
	const threshold = feedbackThreshold(feedbackPrompt, getFeedbackPromptThresholds());
	const eligible =
		splashFinished &&
		(parrotListData?.length ?? 0) > 0 &&
		updateCheckSettled &&
		!updateVisible &&
		!sessionActive &&
		!openedFrom &&
		feedbackPrompt.dayCount >= threshold;

	/** 조건 충족 시 피드백 요청 표시 */
	useEffect(() => {
		if (!eligible || feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = true;
		setPromptOpen(true);

		track('feedback_prompt_shown', { threshold });
	}, [eligible, threshold]);

	/** 피드백 요청 답변 저장 함수 */
	const answerFeedbackPrompt = (wantsToWrite: boolean) => {
		if (!feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = false;

		try {
			consumeFeedbackPrompt();

			if (wantsToWrite) {
				openFeedback('prompt');
			} else {
				track('feedback_prompt_dismissed', { threshold });
			}
		} catch (e) {
			reportError(e, 'feedback_prompt');
		} finally {
			setPromptOpen(false);
		}
	};

	return (
		<>
			{children}

			<FeedbackDialog
				visible={(openedFrom !== null || promptOpen) && !updateVisible}
				prompt={
					promptOpen
						? { onDismiss: () => answerFeedbackPrompt(false), onWrite: () => answerFeedbackPrompt(true) }
						: undefined
				}
			/>
		</>
	);
};

export default StartupDialogProvider;
