import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const uploadSchema = z.object({
	file_id: uuidSchema,
	url: z.string(),
	headers: z.record(z.string(), z.string()),
	expires_in: z.number().int(),
});

export type Upload = z.infer<typeof uploadSchema>;
