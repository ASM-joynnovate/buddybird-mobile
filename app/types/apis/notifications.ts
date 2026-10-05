import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const notificationSchema = z.object({
	id: uuidSchema,
	kind: z.string(),
	title: z.string(),
	body: z.string(),
	image: z.object({ url: z.string() }).nullable(),
	data_id: uuidSchema.nullable(),
	sent_at: timestampSchema,
	read_at: timestampSchema.nullable(),
});

export const pushDataSchema = z.object({
	kind: z.string(),
	notification_id: uuidSchema.optional(),
	data_id: uuidSchema.optional(),
	sent_at: timestampSchema.optional(),
});

export type AppNotification = z.infer<typeof notificationSchema>;
