import { useAuthStore } from '@/stores/auth';

/** 로그인한 사용자 ID를 담은 쿼리 키 앞부분 */
export const userKeyPrefix = () => ['api', useAuthStore.getState().authUserId] as const;

export const apiKeys = {
	all: () => ['api'] as const,
	mutation: (...parts: string[]) => ['api', ...parts] as const,
};
