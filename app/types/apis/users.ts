import { uuid } from '@/types/apis/primitives';

import { z } from 'zod';

export const NICKNAME_PATTERN = /^[\p{Script=Hangul}A-Za-z0-9_ ]{2,20}$/u;

export const userSchema = z.object({
	id: uuid,
	email: z.string().nullable(),
	nickname: z.string().nullable(),
	photo: z.object({ url: z.string() }).nullable(),
});

const updateUserRequestSchema = z.object({
	nickname: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
