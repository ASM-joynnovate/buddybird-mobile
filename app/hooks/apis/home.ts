import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getHomeSummary } from '@/apis/home';

import { apiKeys } from '@/hooks/apis/keys';

/** 홈 요약 정보 조회 Hook에 사용할 옵션 */
export const getHomeSummaryOptions = () => queryOptions({ queryKey: apiKeys.home(), queryFn: getHomeSummary });
/** 홈 요약 정보 조회 Hook */
export const useGetHomeSummary = () => {
	return useSuspenseQuery(getHomeSummaryOptions());
};
