import type { LeaderboardPeriod } from '@/types/apis/leaderboard';

import { userKeyPrefix } from '@/hooks/apis/keys';

export const leaderboardKeys = {
	all: () => [...userKeyPrefix(), 'leaderboard'] as const,
	detail: (period: LeaderboardPeriod, start: string | null) =>
		[...userKeyPrefix(), 'leaderboard', period, start] as const,
};
