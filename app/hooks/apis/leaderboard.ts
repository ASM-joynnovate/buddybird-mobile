import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/apis/leaderboard';

import type { GetLeaderboardParams } from '@/types/apis/leaderboard';

import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';

/** 학습 시간 순위 조회 Hook에 사용할 옵션 */
export const getLeaderboardOptions = ({ period, start }: GetLeaderboardParams) =>
	queryOptions({
		queryKey: leaderboardKeys.detail(period, start),
		queryFn: () => getLeaderboard({ period, start }),
	});
/** 학습 시간 순위 조회 Hook */
export const useGetLeaderboard = ({ period, start }: GetLeaderboardParams) => {
	return useSuspenseQuery(getLeaderboardOptions({ period, start }));
};
