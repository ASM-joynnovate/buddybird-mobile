import { userKeyPrefix } from '@/hooks/apis/keys';

export const feedKeys = {
	all: () => [...userKeyPrefix(), 'feed'] as const,
	list: (country: string | null) => [...userKeyPrefix(), 'feed', country] as const,
};
