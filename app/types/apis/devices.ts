import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { locales } from '@/types/locale';

import { z } from 'zod';

export const deviceSchema = z.object({
	id: uuidSchema,
	client_device_id: uuidSchema,
	timezone: z.string().nullable(),
	locale: z.string(),
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
	locale: z.enum(locales),
});

const updateDeviceRequestSchema = z.object({ locale: z.enum(locales).optional() });

export type Device = z.infer<typeof deviceSchema>;
export type RegisterDeviceRequest = z.infer<typeof registerDeviceRequestSchema>;
export type UpdateDeviceRequest = z.infer<typeof updateDeviceRequestSchema>;
