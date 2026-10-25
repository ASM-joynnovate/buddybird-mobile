import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getHomeSummary } from '@/apis/home';

import { homeKeys } from '@/hooks/apis/keys/home';

/** 홈 요약 정보 조회 Hook에 사용할 옵션 */
export const getHomeSummaryOptions = () => queryOptions({ queryKey: homeKeys.all(), queryFn: getHomeSummary });
/** 홈 요약 정보 조회 Hook */
export const useGetHomeSummary = () => {
	return useSuspenseQuery(getHomeSummaryOptions());
};
