import type { AdKind } from '@/types/apis/ads';

import { userKeyPrefix } from '@/hooks/apis/keys';

export const adKeys = {
	all: () => [...userKeyPrefix(), 'ads'] as const,
	list: (kind: AdKind) => [...userKeyPrefix(), 'ads', kind] as const,
};
