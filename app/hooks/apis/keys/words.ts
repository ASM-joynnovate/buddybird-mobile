import { userKeyPrefix } from '@/hooks/apis/keys';

export const wordKeys = {
	all: () => [...userKeyPrefix(), 'words'] as const,
	detail: (id: string) => [...userKeyPrefix(), 'words', id] as const,
	recordingDuration: (id: string) => [...userKeyPrefix(), 'recordings', id, 'duration'] as const,
};
