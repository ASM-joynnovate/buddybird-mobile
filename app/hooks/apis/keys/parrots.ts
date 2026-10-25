import { userKeyPrefix } from '@/hooks/apis/keys';

export const parrotKeys = {
	all: () => [...userKeyPrefix(), 'parrots'] as const,
};
