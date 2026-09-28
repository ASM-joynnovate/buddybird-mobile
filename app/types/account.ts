import { z } from 'zod';

export const loginProviderSchema = z.enum(['google', 'kakao', 'apple']);

export const accountSchema = z.object({
	registeredUser: z.string().nullable(),
	serverUserId: z.string().nullable(),
	isAnonymous: z.boolean(),
	loginScreenSeen: z.boolean(),
	provider: loginProviderSchema.nullable(),
	lastLogin: loginProviderSchema.nullable(),
	clientDeviceId: z.string().nullable(),
});

export type LoginProvider = z.infer<typeof loginProviderSchema>;

export type Account = z.infer<typeof accountSchema>;
