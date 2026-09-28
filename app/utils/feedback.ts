import type { DeviceSettings } from '@/types/device-settings';

import { FEEDBACK_PROMPT_THRESHOLDS } from '@/config/policy';

/** 지금 단계에서 의견 요청을 띄울 접속일 수 */
export const feedbackThreshold = (feedbackPrompt: DeviceSettings['feedbackPrompt']) => {
	const lastIndex = FEEDBACK_PROMPT_THRESHOLDS.length - 1;

	return FEEDBACK_PROMPT_THRESHOLDS[Math.min(Math.max(feedbackPrompt.thresholdIndex, 0), lastIndex)];
};
