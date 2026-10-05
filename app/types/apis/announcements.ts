import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const announcementSchema = z.object({
	id: uuidSchema,
	title: z.string(),
	body: z.string().nullable(),
	starts_at: timestampSchema,
	ends_at: timestampSchema.nullable(),
	is_read: z.boolean(),
	images: z.array(z.object({ id: uuidSchema, url: z.string() })),
});

export type Announcement = z.infer<typeof announcementSchema>;
