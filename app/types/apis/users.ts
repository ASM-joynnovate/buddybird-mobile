import { fileSchema, publicFileSchema } from '@/types/apis/common';
import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const userSchema = z.object({
	id: uuidSchema,
	email: z.string().nullable(),
	nickname: z.string().nullable(),
	photo_file: fileSchema.nullable(),
	uploading_photo_file: fileSchema.nullable(),
	country: z.string().nullish(),
});

const updateUserRequestSchema = z.object({
	nickname: z.string().nullable().optional(),
	country: z.string().optional(),
});

const communityParrotSchema = z.object({
	name: z.string(),
	species: z.string(),
	photo_file: publicFileSchema.nullable(),
});

export const communityUserSchema = z.object({
	id: uuidSchema,
	nickname: z.string().nullable(),
	photo_file: publicFileSchema.nullable(),
	country: z.string().nullable(),
	parrots: z.array(communityParrotSchema),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type CommunityUser = z.infer<typeof communityUserSchema>;
