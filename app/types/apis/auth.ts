import { uuid } from '@/types/apis/primitives';

import { z } from 'zod';

const loginRequestSchema = z.object({
	google: z.object({ refresh_token: z.string() }).optional(),
	apple: z.object({ client_id: z.string(), authorization_code: z.string() }).optional(),
	language: z.enum(['ko', 'en']),
});

export const loginSchema = z.object({ user_id: uuid, is_new_user: z.boolean() });

export const withdrawalSchema = z.object({ user_id: uuid });

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type Login = z.infer<typeof loginSchema>;
