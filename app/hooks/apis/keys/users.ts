import { userKeyPrefix } from '@/hooks/apis/keys';

export const userKeys = {
	me: () => [...userKeyPrefix(), 'users', 'me'] as const,
};
