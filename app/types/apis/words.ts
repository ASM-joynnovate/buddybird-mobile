import { fileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

const recordingSchema = z.object({ id: uuidSchema, audio_file: fileSchema, created_at: timestampSchema });

export const wordSchema = z.object({
	id: uuidSchema,
	name: z.string(),
	recordings: z.array(recordingSchema),
});

export type Recording = z.infer<typeof recordingSchema>;
export type Word = z.infer<typeof wordSchema>;
