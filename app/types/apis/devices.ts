import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const deviceSchema = z.object({
	id: uuidSchema,
	client_device_id: uuidSchema,
	timezone: z.string().nullable(),
	last_seen_at: timestampSchema.nullable(),
	client: z.object({
		platform: z.string(),
		os_version: z.string(),
		model: z.string(),
		app_version: z.string(),
	}),
	push_registered: z.boolean(),
});

const registerDeviceRequestSchema = z.object({
	client_device_id: uuidSchema,
	platform: z.string().min(1).max(10),
	os_version: z.string().min(1).max(20),
	model: z.string().min(1).max(100),
	app_version: z.string().min(1).max(12),
	timezone: z.string().min(1).max(64).nullable().optional(),
});

export type Device = z.infer<typeof deviceSchema>;
export type RegisterDeviceRequest = z.infer<typeof registerDeviceRequestSchema>;
