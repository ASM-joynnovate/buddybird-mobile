import { z } from "zod"

import { locales } from "@/types/locale"

export const deviceSettingsSchema = z.object({
	locale: z.enum(locales),
	analyticsConsent: z.enum(["unknown", "granted", "denied", "not_applicable"]),
	update: z.object({ dismissedVersion: z.string().nullable() }),
	feedback: z.object({
		version: z.literal(1),
		lastCountedDate: z.string().nullable(),
		dayCount: z.number().nonnegative(),
		thresholdIndex: z.number().nonnegative(),
	}),
	guides: z.object({ usage: z.boolean(), placement: z.boolean(), recording: z.boolean() }),
})

export type DeviceSettings = z.infer<typeof deviceSettingsSchema>

export type Guide = keyof DeviceSettings["guides"]
