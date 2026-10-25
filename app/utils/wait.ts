import { UPLOAD_POLL_MAX_INTERVAL_MS } from '@/config/policy';

/** ms 동안 대기하는 함수 */
export const wait = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

/** 다음 업로드 확인 간격을 반환하는 함수 */
export const nextUploadPollIntervalMs = (intervalMs: number) => {
	return Math.min(intervalMs * 2, UPLOAD_POLL_MAX_INTERVAL_MS);
};
