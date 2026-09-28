import { useEffect, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { parrotsQueryOptions } from '@/hooks/apis/parrots';
import { runningSessionQueryOptions } from '@/hooks/apis/sessions';

import { reportError, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useFeedbackStore } from '@/stores/feedback';
import { feedbackThreshold } from '@/utils/feedback';

export function useFeedbackPrompt(updatesSettled: boolean, updateVisible: boolean) {
	const preferences = useDeviceSettingsStore((state) => state.feedback);

	const feedback = useFeedbackStore();

	const parrots = useQuery(parrotsQueryOptions());
	const running = useQuery(runningSessionQueryOptions());

	const [open, setOpen] = useState(false);

	const feedbackPromptOpen = useRef(false);

	const sessionActive = running.data != null;
	const threshold = feedbackThreshold(preferences);
	const eligible =
		(parrots.data?.length ?? 0) > 0 &&
		updatesSettled &&
		!updateVisible &&
		!sessionActive &&
		!feedback.source &&
		preferences.dayCount >= threshold;

	useEffect(() => {
		if (!eligible || feedbackPromptOpen.current) {
			return;
		}

		feedbackPromptOpen.current = true;
		setOpen(true);

		track('feedback_prompt_shown', { threshold });
	}, [eligible, threshold]);

	function consume(write: boolean) {
		if (!feedbackPromptOpen.current) {
			return;
		}

		feedbackPromptOpen.current = false;

		try {
			useDeviceSettingsStore.getState().consumeFeedbackPrompt();

			if (write) {
				feedback.open('prompt');
			} else {
				track('feedback_prompt_dismissed', { threshold });
			}
		} catch (error) {
			reportError(error, 'feedback_prompt');
		} finally {
			setOpen(false);
		}
	}

	return {
		visible: open && eligible,
		onDismiss: () => consume(false),
		onWrite: () => consume(true),
	};
}
