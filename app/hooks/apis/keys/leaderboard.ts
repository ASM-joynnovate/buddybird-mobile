import { userKeyPrefix } from '@/hooks/apis/keys';

export const leaderboardKeys = {
	all: () => [...userKeyPrefix(), 'leaderboard'] as const,
	detail: (country: string | null) => [...userKeyPrefix(), 'leaderboard', country] as const,
};
