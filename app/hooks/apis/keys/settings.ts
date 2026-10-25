import { userKeyPrefix } from '@/hooks/apis/keys';

export const settingKeys = {
	all: () => [...userKeyPrefix(), 'users', 'me', 'settings'] as const,
	notifications: () => [...userKeyPrefix(), 'users', 'me', 'settings', 'notifications'] as const,
};
