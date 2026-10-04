import { fileSchema } from '@/types/apis/common';
import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const userSchema = z.object({
	id: uuidSchema,
	email: z.string().nullable(),
	nickname: z.string().nullable(),
	photo_file: fileSchema.nullable(),
	uploading_photo_file: fileSchema.nullable(),
});

const updateUserRequestSchema = z.object({
	nickname: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
