import type { CreateAbuseReportRequest } from '@/types/apis/abuse-reports';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const postAbuseReport = async ({
	data,
	idempotencyKey,
}: {
	data: CreateAbuseReportRequest;
	idempotencyKey: string;
}): Promise<void> => {
	await apiRequest('/api/v1/abuse-reports', z.unknown(), { method: 'POST', json: data, idempotencyKey });
};
