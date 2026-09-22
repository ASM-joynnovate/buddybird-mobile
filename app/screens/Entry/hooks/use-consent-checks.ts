import { useFocusEffect } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useCallback, useState } from "react"

import type { Consent } from "@/apis/consents"
import { consentsQueryOptions, saveConsentsMutationOptions } from "@/hooks/apis/consents"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { latestConsents, takeAgreed } from "@/screens/Entry/consent-agreements"

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
	const locale = useDeviceSetting("locale")
	const query = useQuery(consentsQueryOptions(locale))
	const mutation = useMutation(saveConsentsMutationOptions())
	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const consents = query.data ? latestConsents(query.data) : undefined
	const isChecked = (consent: Consent) => checked[consent.id] ?? consent.status === "granted"
	const allChecked = Boolean(consents?.length) && (consents ?? []).every(isChecked)

	useFocusEffect(
		useCallback(() => {
			const agreed = takeAgreed()

			if (agreed.length) {
				setChecked((current) => ({
					...current,
					...Object.fromEntries(agreed.map((id) => [id, true])),
				}))
			}
		}, []),
	)

	function save() {
		if (!consents || mutation.isPending) {
			return
		}

		mutation.mutate(
			{
				decisions: consents.map((consent) => ({
					consent_id: consent.id,
					status: isChecked(consent) ? "granted" : "denied",
				})),
				idempotencyKey: randomUUID(),
			},
			{ onSuccess: onSaved },
		)
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
