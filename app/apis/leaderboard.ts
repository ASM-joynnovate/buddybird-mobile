import { type GetLeaderboardParams, type Leaderboard, leaderboardSchema } from '@/types/apis/leaderboard';

import { apiRequest } from '@/lib/api';

export const getLeaderboard = async ({ period, metric, country }: GetLeaderboardParams): Promise<Leaderboard> => {
	const { data: leaderboard } = await apiRequest('/api/v1/leaderboard', leaderboardSchema, {
		searchParams: { period, metric, country: country ?? undefined },
	});

	return leaderboard;
};
