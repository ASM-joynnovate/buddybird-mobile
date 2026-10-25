import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getReport } from '@/apis/reports';

import type { ReportParams } from '@/types/apis/reports';

import { reportKeys } from '@/hooks/apis/keys/reports';

/** 리포트 조회 Hook에 사용할 옵션 */
export const getReportOptions = ({ period, start }: ReportParams) =>
	queryOptions({
		queryKey: reportKeys.detail(period, start),
		queryFn: () => getReport({ period, start }),
	});
/** 리포트 조회 Hook */
export const useGetReport = ({ period, start }: ReportParams) => {
	return useSuspenseQuery(getReportOptions({ period, start }));
};
/** suspense 없는 리포트 조회 Hook */
export const useGetReportQuery = ({ period, start }: ReportParams) => {
	return useQuery(getReportOptions({ period, start }));
};
