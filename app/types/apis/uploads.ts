import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const uploadSchema = z.object({
	file_id: uuidSchema,
	url: z.string(),
	headers: z.record(z.string(), z.string()),
	expires_in: z.number().int(),
});

export const wordRecordingUploadSchema = uploadSchema.extend({ recording_id: uuidSchema });

export const petcamEventUploadSchema = uploadSchema.extend({ event_id: uuidSchema });

export type Upload = z.infer<typeof uploadSchema>;
export type PetcamEventUpload = z.infer<typeof petcamEventUploadSchema>;
export type WordRecordingUpload = z.infer<typeof wordRecordingUploadSchema>;
