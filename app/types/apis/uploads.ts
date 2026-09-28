import { uuid } from '@/types/apis/primitives';

import { z } from 'zod';

import { MIB } from '@/utils/units';

export const MAX_UPLOAD_BYTES = 5 * MIB;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'];

export const uploadSchema = z.object({
	file_id: uuid,
	url: z.string(),
	headers: z.record(z.string(), z.string()),
	expires_in: z.number().int(),
});

export type Upload = z.infer<typeof uploadSchema>;
