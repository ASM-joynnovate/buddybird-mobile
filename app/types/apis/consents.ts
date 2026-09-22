import { z } from "zod"

import { timestamp, uuid } from "@/types/apis/primitives"

const consentStatusSchema = z.enum(["granted", "denied"])

export const consentSchema = z.object({
	id: uuid,
	kind: z.string(),
	version: z.number().int().positive(),
	title: z.string(),
	body: z.string(),
	is_required: z.boolean(),
	published_at: timestamp,
	status: consentStatusSchema.nullable(),
})

export const saveConsentRequestSchema = z.object({
	consent_id: uuid,
	status: consentStatusSchema,
})

export type Consent = z.infer<typeof consentSchema>
export type ConsentStatus = z.infer<typeof consentStatusSchema>
export type SaveConsentRequest = z.infer<typeof saveConsentRequestSchema>
