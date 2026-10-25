import { type ReactNode, useEffect, useRef, useState } from 'react';

import type { DeviceSettings } from '@/types/device-settings';

import { useGetParrotListQuery } from '@/hooks/apis/parrots';
import { useGetRunningSessionQuery } from '@/hooks/apis/sessions';

import { useUpdatePrompt } from '@/providers/update-dialog';
import { getFeedbackPromptThresholds } from '@/services/remote-config/client';
import { reportError, track } from '@/services/telemetry/client';
import { useAppStore } from '@/stores/app';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useFeedbackStore } from '@/stores/feedback';

import FeedbackDialog from '@/components/dialogs/feedback-dialog';

/** 피드백 요청을 표시할 접속일 수를 반환하는 함수 */
const feedbackThreshold = (feedbackPrompt: DeviceSettings['feedbackPrompt'], thresholds: readonly number[]) => {
	const lastIndex = thresholds.length - 1;

	return thresholds[Math.min(Math.max(feedbackPrompt.thresholdIndex, 0), lastIndex)];
};

interface Props {
	children: ReactNode;
}

/**
 * 앱 시작 다이얼로그 provider
 * @param children 감싸는 내용
 */
const FeedbackDialogProvider = ({ children }: Props) => {
	const [feedbackPromptOpen, setFeedbackPromptOpen] = useState(false);

	const feedbackPromptOpenRef = useRef(false);

	const { data: parrotListData } = useGetParrotListQuery();
	const { data: runningSessionData } = useGetRunningSessionQuery();

	const splashFinished = useAppStore((state) => state.splashFinished);

	const feedbackPrompt = useDeviceSettingsStore((state) => state.feedbackPrompt);
	const openedFrom = useFeedbackStore((state) => state.openedFrom);

	const consumeFeedbackPrompt = useDeviceSettingsStore((state) => state.consumeFeedbackPrompt);
	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	const { updateVisible, updateCheckSettled } = useUpdatePrompt();

	const sessionActive = runningSessionData != null;
	const threshold = feedbackThreshold(feedbackPrompt, getFeedbackPromptThresholds());
	const feedbackPromptEligible =
		splashFinished &&
		(parrotListData?.length ?? 0) > 0 &&
		updateCheckSettled &&
		!updateVisible &&
		!sessionActive &&
		!openedFrom &&
		feedbackPrompt.dayCount >= threshold;

	/** 조건 충족 시 피드백 요청 표시 */
	useEffect(() => {
		if (!feedbackPromptEligible || feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = true;
		setFeedbackPromptOpen(true);

		track('feedback_prompt_shown', { threshold });
	}, [feedbackPromptEligible, threshold]);

	/** 피드백 요청 답변 저장 함수 */
	const answerFeedbackPrompt = (shouldWrite: boolean) => {
		if (!feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = false;

		try {
			consumeFeedbackPrompt();

			if (shouldWrite) {
				openFeedback('prompt');
			} else {
				track('feedback_prompt_dismissed', { threshold });
			}
		} catch (e) {
			reportError(e, 'feedback_prompt');
		} finally {
			setFeedbackPromptOpen(false);
		}
	};

	return (
		<>
			{children}

			<FeedbackDialog
				visible={(openedFrom !== null || feedbackPromptOpen) && !updateVisible}
				prompt={
					feedbackPromptOpen
						? { onDismiss: () => answerFeedbackPrompt(false), onWrite: () => answerFeedbackPrompt(true) }
						: undefined
				}
			/>
		</>
	);
};

export default FeedbackDialogProvider;
