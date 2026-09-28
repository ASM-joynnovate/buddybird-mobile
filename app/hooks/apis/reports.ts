import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getReport } from '@/apis/reports';

import type { Report } from '@/types/apis/reports';

import { apiKeys } from '@/hooks/apis/keys';

/** 리포트 조회 옵션 */
export const getReportOptions = ({ period, start }: { period: Report['period']; start: string }) =>
	queryOptions({
		queryKey: apiKeys.reports.detail(period, start),
		queryFn: () => getReport({ period, start }),
	});
/** 리포트 조회 훅 */
export const useGetReport = ({ period, start }: { period: Report['period']; start: string }) => {
	return useSuspenseQuery(getReportOptions({ period, start }));
};
