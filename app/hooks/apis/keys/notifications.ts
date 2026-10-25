import { userKeyPrefix } from '@/hooks/apis/keys';

export const notificationKeys = {
	all: () => [...userKeyPrefix(), 'notifications'] as const,
	list: () => [...userKeyPrefix(), 'notifications', 'list'] as const,
	detail: (id: string) => [...userKeyPrefix(), 'notifications', id] as const,
};
