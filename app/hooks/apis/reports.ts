import { queryOptions } from '@tanstack/react-query';

import { getReport } from '@/apis/reports';

import type { Report } from '@/types/apis/reports';

import { apiKeys } from '@/hooks/apis/keys';

export const reportQueryOptions = (period: Report['period'], start: string) =>
	queryOptions({
		queryKey: apiKeys.reports.detail(period, start),
		queryFn: () => getReport({ period, start }),
	});
