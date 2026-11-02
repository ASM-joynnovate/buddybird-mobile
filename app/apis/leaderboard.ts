import { type GetLeaderboardParams, type Leaderboard, leaderboardSchema } from '@/types/apis/leaderboard';

import { apiRequest } from '@/lib/api';

import { LEADERBOARD_RANK_LIMIT } from '@/config/policy';

export const getLeaderboard = async ({ period, start }: GetLeaderboardParams): Promise<Leaderboard> => {
	const { data: leaderboard } = await apiRequest('/api/v1/leaderboard', leaderboardSchema, {
		searchParams: { period, metric: 'learning_time', start: start ?? undefined, limit: LEADERBOARD_RANK_LIMIT },
	});

	return leaderboard;
};
