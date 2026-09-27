import { z } from "zod"

import { timestamp, uuid } from "@/types/apis/primitives"

export const deviceSchema = z.object({
	id: uuid,
	client_device_id: uuid,
	timezone: z.string().nullable(),
	last_seen_at: timestamp.nullable(),
	client: z.object({
		platform: z.string(),
		os_version: z.string(),
		model: z.string(),
		app_version: z.string(),
	}),
	push_registered: z.boolean(),
})

const registerDeviceRequestSchema = z.object({
	client_device_id: uuid,
	platform: z.string().min(1).max(10),
	os_version: z.string().min(1).max(20),
	model: z.string().min(1).max(100),
	app_version: z.string().min(1).max(12),
	timezone: z.string().min(1).max(64).nullable().optional(),
})

export type Device = z.infer<typeof deviceSchema>
export type RegisterDeviceRequest = z.infer<typeof registerDeviceRequestSchema>
