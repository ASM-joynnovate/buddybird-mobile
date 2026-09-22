import { z } from "zod"

import { mockServer } from "@/mocks/server"
import { type Consent, consentSchema, type SaveConsentRequest } from "@/types/apis/consents"

export async function fetchConsents(): Promise<Consent[]> {
	return z.array(consentSchema).parse(await mockServer.consents.list())
}

export async function saveConsent(
	decision: SaveConsentRequest,
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.consents.save(decision)
}
