import type { DeviceSettings } from '@/types/device-settings';

import { FEEDBACK_PROMPT_THRESHOLDS } from '@/config/policy';

/** 피드백 요청을 표시할 접속일 수를 반환하는 함수 */
export const feedbackThreshold = (feedbackPrompt: DeviceSettings['feedbackPrompt']) => {
	const lastIndex = FEEDBACK_PROMPT_THRESHOLDS.length - 1;

	return FEEDBACK_PROMPT_THRESHOLDS[Math.min(Math.max(feedbackPrompt.thresholdIndex, 0), lastIndex)];
};
