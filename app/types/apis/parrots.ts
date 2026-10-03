import { fileSchema } from '@/types/apis/common';
import { localDateSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const parrotSchema = z.object({
	id: uuidSchema,
	name: z.string(),
	species: z.string(),
	birthdate: localDateSchema.nullable(),
	photo_file: fileSchema.nullable(),
	uploading_photo_file: fileSchema.nullable(),
});

const createParrotRequestSchema = z.object({
	name: z.string(),
	species: z.string(),
	birthdate: localDateSchema.nullable().optional(),
});

const updateParrotRequestSchema = z.object({
	name: z.string().optional(),
	species: z.string().optional(),
	birthdate: localDateSchema.nullable().optional(),
});

export type Parrot = z.infer<typeof parrotSchema>;
export type CreateParrotRequest = z.infer<typeof createParrotRequestSchema>;
export type UpdateParrotRequest = z.infer<typeof updateParrotRequestSchema>;
