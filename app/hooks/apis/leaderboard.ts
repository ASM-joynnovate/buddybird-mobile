import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/apis/leaderboard';

import type { CountryParams } from '@/types/apis/common';

import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';

/** 학습 시간 순위 조회 Hook에 사용할 옵션 */
export const getLeaderboardOptions = ({ country }: CountryParams) =>
	queryOptions({
		queryKey: leaderboardKeys.detail(country),
		queryFn: () => getLeaderboard({ period: 'monthly', metric: 'learning_time', country }),
	});
/** 학습 시간 순위 조회 Hook */
export const useGetLeaderboard = ({ country }: CountryParams) => {
	return useSuspenseQuery(getLeaderboardOptions({ country }));
};
