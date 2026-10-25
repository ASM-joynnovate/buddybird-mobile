import { userKeyPrefix } from '@/hooks/apis/keys';

export const deviceKeys = {
	all: () => [...userKeyPrefix(), 'devices'] as const,
};
