import type { SessionLogKind } from '@/types/apis/sessions';

import { userKeyPrefix } from '@/hooks/apis/keys';

export const sessionKeys = {
	all: () => [...userKeyPrefix(), 'sessions'] as const,
	running: () => [...userKeyPrefix(), 'sessions', 'running'] as const,
	detail: (id: string) => [...userKeyPrefix(), 'sessions', id] as const,
	log: (id: string) => [...userKeyPrefix(), 'sessions', id, 'log'] as const,
	logByKinds: (id: string, kinds: SessionLogKind[]) => [...sessionKeys.log(id), kinds] as const,
	summary: (id: string) => [...userKeyPrefix(), 'sessions', id, 'summary'] as const,
	soundDuration: (id: string) => [...userKeyPrefix(), 'session-sounds', id, 'duration'] as const,
};
