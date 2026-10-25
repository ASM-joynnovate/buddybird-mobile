import { authSchema, loginProviderSchema } from '@/types/auth';

import { z } from 'zod';

export const accountSchema = z.object({
	serverUserId: z.string().nullable(),
});

export const accountV2Schema = authSchema.extend({
	serverUserId: z.string().nullable(),
	lastLoginProvider: loginProviderSchema.nullable(),
	clientDeviceId: z.string().nullable(),
});

export type Account = z.infer<typeof accountSchema>;

export type AccountV2 = z.infer<typeof accountV2Schema>;
