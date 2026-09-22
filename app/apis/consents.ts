import { z } from "zod"

import { mockServer } from "@/apis/mock/server"
import type { Locale } from "@/types/locale"

const consentSchema = z.object({
	id: z.uuid(),
	kind: z.string(),
	version: z.number().int().positive(),
	title: z.string(),
	body: z.string(),
	is_required: z.boolean(),
	status: z.enum(["granted", "denied"]).nullable(),
})

export type Consent = z.infer<typeof consentSchema>

export type ConsentDecision = { consent_id: string; status: "granted" | "denied" }

export async function fetchConsents(locale: Locale): Promise<Consent[]> {
	return z.array(consentSchema).parse(await mockServer.consents.list(locale))
}

export async function saveConsents(
	decisions: ConsentDecision[],
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.consents.save(decisions)
}
