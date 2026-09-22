import { useFocusEffect } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useCallback, useState } from "react"

import { consentsQueryOptions, saveConsentMutationOptions } from "@/hooks/apis/consents"
import { latestConsents } from "@/screens/Entry/consent-agreements"
import { useConsentStore } from "@/stores/consent"
import type { Consent } from "@/types/apis/consents"

export function useConsentChecks(onSaved?: () => void): {
	consents: Consent[] | undefined
	loadFailed: boolean
	retry(): void
	isChecked(consent: Consent): boolean
	toggle(consent: Consent): void
	allChecked: boolean
	toggleAll(): void
	ready: boolean
	saving: boolean
	saveFailed: boolean
	save(): void
} {
	const query = useQuery(consentsQueryOptions())

	const mutation = useMutation(saveConsentMutationOptions())

	const [checked, setChecked] = useState<Record<string, boolean>>({})

	const consents = query.data ? latestConsents(query.data) : undefined
	const isChecked = (consent: Consent) => checked[consent.id] ?? consent.status === "granted"
	const allChecked = Boolean(consents?.length) && (consents ?? []).every(isChecked)

	useFocusEffect(
		useCallback(() => {
			const agreed = useConsentStore.getState().takeAgreed()

			if (agreed.length) {
				setChecked((current) => ({
					...current,
					...Object.fromEntries(agreed.map((id) => [id, true])),
				}))
			}
		}, []),
	)

	async function saveDecisions(items: readonly Consent[]) {
		for (const consent of items) {
			await mutation.mutateAsync({
				decision: {
					consent_id: consent.id,
					status: isChecked(consent) ? "granted" : "denied",
				},
				idempotencyKey: randomUUID(),
			})
		}

		onSaved?.()
	}

	function save() {
		if (!consents || mutation.isPending) {
			return
		}

		saveDecisions(consents).catch(() => undefined)
	}

	return {
		consents,
		loadFailed: query.isError,
		retry: () => void query.refetch(),
		isChecked,
		toggle: (consent) =>
			setChecked((current) => ({ ...current, [consent.id]: !isChecked(consent) })),
		allChecked,
		toggleAll: () =>
			setChecked(
				Object.fromEntries((consents ?? []).map((consent) => [consent.id, !allChecked])),
			),
		ready: (consents ?? []).every((consent) => !consent.is_required || isChecked(consent)),
		saving: mutation.isPending,
		saveFailed: mutation.isError,
		save,
	}
}
