import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const abuseReportReasons = ['spam', 'inappropriate_content', 'harassment', 'other'] as const;

const createAbuseReportRequestSchema = z.object({
	reported_user_id: uuidSchema,
	feed_item_id: uuidSchema.optional(),
	reason: z.enum(abuseReportReasons),
	description: z.string().optional(),
});

export type AbuseReportReason = (typeof abuseReportReasons)[number];
export type CreateAbuseReportRequest = z.infer<typeof createAbuseReportRequestSchema>;
