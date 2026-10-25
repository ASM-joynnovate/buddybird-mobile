import { z } from 'zod';

export const loginProviderSchema = z.enum(['google', 'kakao', 'apple']);

export const authSchema = z.object({
	authUserId: z.string().nullable(),
	isAnonymous: z.boolean(),
	loginScreenSeen: z.boolean(),
	loginProvider: loginProviderSchema.nullable(),
});

export type LoginProvider = z.infer<typeof loginProviderSchema>;

export type Auth = z.infer<typeof authSchema>;
