import { userKeyPrefix } from '@/hooks/apis/keys';

export const sessionKeys = {
	all: () => [...userKeyPrefix(), 'sessions'] as const,
	running: () => [...userKeyPrefix(), 'sessions', 'running'] as const,
	detail: (id: string) => [...userKeyPrefix(), 'sessions', id] as const,
	sounds: (id: string) => [...userKeyPrefix(), 'sessions', id, 'sounds'] as const,
	events: (id: string) => [...userKeyPrefix(), 'sessions', id, 'events'] as const,
	summary: (id: string) => [...userKeyPrefix(), 'sessions', id, 'summary'] as const,
	soundDuration: (id: string) => [...userKeyPrefix(), 'session-sounds', id, 'duration'] as const,
};
