import { userKeyPrefix } from '@/hooks/apis/keys';

export const consentKeys = {
	all: () => [...userKeyPrefix(), 'users', 'me', 'consents'] as const,
};
