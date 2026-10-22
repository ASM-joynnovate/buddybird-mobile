import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/apis/leaderboard';

import { apiKeys } from '@/hooks/apis/keys';

/** 학습 시간 순위 조회 Hook에 사용할 옵션 */
export const getLeaderboardOptions = ({ country }: { country: string | null }) =>
	queryOptions({
		queryKey: apiKeys.leaderboard.detail(country),
		queryFn: () => getLeaderboard({ period: 'monthly', metric: 'learning_time', country }),
	});
/** 학습 시간 순위 조회 Hook */
export const useGetLeaderboard = ({ country }: { country: string | null }) => {
	return useSuspenseQuery(getLeaderboardOptions({ country }));
};
