import { useAccountStore } from '@/stores/account';

const userKeyPrefix = () => ['api', useAccountStore.getState().authUserId] as const;

export const apiKeys = {
	all: () => ['api'] as const,
	appUpdate: () => ['api', 'app-update'] as const,
	me: () => [...userKeyPrefix(), 'users', 'me'] as const,
	settings: () => [...userKeyPrefix(), 'users', 'me', 'settings'] as const,
	consents: {
		all: () => [...userKeyPrefix(), 'users', 'me', 'consents'] as const,
	},
	devices: () => [...userKeyPrefix(), 'devices'] as const,
	parrots: {
		all: () => [...userKeyPrefix(), 'parrots'] as const,
	},
	words: {
		all: () => [...userKeyPrefix(), 'words'] as const,
		detail: (id: string) => [...userKeyPrefix(), 'words', id] as const,
	},
	sessions: {
		all: () => [...userKeyPrefix(), 'sessions'] as const,
		running: () => [...userKeyPrefix(), 'sessions', 'running'] as const,
		detail: (id: string) => [...userKeyPrefix(), 'sessions', id] as const,
		sounds: (id: string) => [...userKeyPrefix(), 'sessions', id, 'sounds'] as const,
	},
	home: () => [...userKeyPrefix(), 'home'] as const,
	notifications: () => [...userKeyPrefix(), 'notifications'] as const,
	reports: {
		all: () => [...userKeyPrefix(), 'reports'] as const,
		detail: (period: string, start: string) => [...userKeyPrefix(), 'reports', period, start] as const,
	},
	notices: {
		all: () => [...userKeyPrefix(), 'notices'] as const,
		list: () => [...userKeyPrefix(), 'notices', 'list'] as const,
		detail: (id: string) => [...userKeyPrefix(), 'notices', id] as const,
	},
	recordings: {
		duration: (id: string) => [...userKeyPrefix(), 'recordings', id, 'duration'] as const,
	},
	mutation: (...parts: string[]) => ['api', ...parts] as const,
};
