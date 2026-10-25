import { userKeyPrefix } from '@/hooks/apis/keys';

export const reportKeys = {
	all: () => [...userKeyPrefix(), 'reports'] as const,
	detail: (period: string, start: string) => [...userKeyPrefix(), 'reports', period, start] as const,
};
