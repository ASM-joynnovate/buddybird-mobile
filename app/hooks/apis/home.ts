import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getHomeSummary } from '@/apis/home';

import { apiKeys } from '@/hooks/apis/keys';

/** 홈 요약 조회 옵션 */
export const getHomeSummaryOptions = () => queryOptions({ queryKey: apiKeys.home(), queryFn: getHomeSummary });
/** 홈 요약 조회 훅 */
export const useGetHomeSummary = () => {
	return useSuspenseQuery(getHomeSummaryOptions());
};
