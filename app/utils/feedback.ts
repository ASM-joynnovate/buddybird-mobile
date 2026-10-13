import type { DeviceSettings } from '@/types/device-settings';

/** 피드백 요청을 표시할 접속일 수를 반환하는 함수 */
export const feedbackThreshold = (feedbackPrompt: DeviceSettings['feedbackPrompt'], thresholds: readonly number[]) => {
	const lastIndex = thresholds.length - 1;

	return thresholds[Math.min(Math.max(feedbackPrompt.thresholdIndex, 0), lastIndex)];
};
