import { userKeyPrefix } from '@/hooks/apis/keys';

export const announcementKeys = {
	all: () => [...userKeyPrefix(), 'announcements'] as const,
	list: () => [...userKeyPrefix(), 'announcements', 'list'] as const,
	detail: (id: string) => [...userKeyPrefix(), 'announcements', id] as const,
};
