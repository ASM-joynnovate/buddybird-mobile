import type { Consent } from "@/apis/consents"

let agreed: readonly string[] = []

export function markAgreed(id: string): void {
	agreed = [...agreed, id]
}

export function takeAgreed(): readonly string[] {
	const ids = agreed

	agreed = []

	return ids
}

export function latestConsents(consents: readonly Consent[]): Consent[] {
	return consents.filter(
		(consent) =>
			!consents.some(
				(other) => other.kind === consent.kind && other.version > consent.version,
			),
	)
}
