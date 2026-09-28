import type { DeviceSettings } from '@/types/device-settings';

import { FEEDBACK_PROMPT_THRESHOLDS } from '@/config/policy';

export function feedbackThreshold(state: DeviceSettings['feedbackPrompt']) {
	const lastIndex = FEEDBACK_PROMPT_THRESHOLDS.length - 1;

	return FEEDBACK_PROMPT_THRESHOLDS[Math.min(Math.max(state.thresholdIndex, 0), lastIndex)];
}
