import { localDateSchema, timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

const notificationKindSchema = z.enum(['mimicry', 'daily_summary', 'streak']);

export const notificationSchema = z.object({
	id: uuidSchema,
	kind: notificationKindSchema,
	title: z.string(),
	body: z.string(),
	image: z.object({ url: z.string() }).nullable(),
	sound_id: uuidSchema.nullable(),
	report_date: localDateSchema.nullable(),
	sent_at: timestampSchema,
	read_at: timestampSchema.nullable(),
});

export const pushDataSchema = z.object({
	kind: notificationKindSchema,
	report_date: localDateSchema.optional(),
	sent_at: timestampSchema,
});

export type NotificationKind = z.infer<typeof notificationKindSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
