import type { UploadConsent } from "@/types/consent"

export function shouldPromptUploadConsent(
	consent: UploadConsent,
	coldStart: boolean,
	now = Date.now(),
) {
	if (consent.status === "granted") {
		return false
	}

	if (consent.status === "unknown" || !consent.decidedAt) {
		return true
	}

	const decided = Date.parse(consent.decidedAt)

	return coldStart && (!Number.isFinite(decided) || now - decided >= 30 * 86400_000)
}
