import { type Leaderboard, leaderboardSchema } from '@/types/apis/leaderboard';

import { apiRequest } from '@/lib/api';

export const getLeaderboard = async ({
	period,
	metric,
	country,
}: {
	period: string;
	metric: string;
	country: string | null;
}): Promise<Leaderboard> => {
	const { data: leaderboard } = await apiRequest('/api/v1/leaderboard', leaderboardSchema, {
		searchParams: { period, metric, country: country ?? undefined },
	});

	return leaderboard;
};
