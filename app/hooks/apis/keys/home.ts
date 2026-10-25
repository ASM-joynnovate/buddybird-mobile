import { userKeyPrefix } from '@/hooks/apis/keys';

export const homeKeys = {
	all: () => [...userKeyPrefix(), 'home'] as const,
};
