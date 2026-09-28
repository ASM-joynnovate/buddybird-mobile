import { useCallback, useState } from 'react';

import type { Consent } from '@/types/apis/consents';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useFocusEffect } from '@react-navigation/native';

import { useConsentStore } from '@/stores/consent';
import { latestConsents } from '@/utils/latest-consents';

export function useConsentChecks(onSaved?: () => void): {
	consents: Consent[];
	isChecked(consent: Consent): boolean;
	toggle(consent: Consent): void;
	allChecked: boolean;
	toggleAll(): void;
	ready: boolean;
	saving: boolean;
	saveFailed: boolean;
	save(): void;
} {
	const [checked, setChecked] = useState<Record<string, boolean>>({});

	const { data: consentListData } = useGetConsentList();

	const { isError: isSaveError, isPending, mutateAsync } = useSaveConsent();

	const agreedIds = useConsentStore((state) => state.agreedIds);
	const clearAgreedIds = useConsentStore((state) => state.clearAgreedIds);

	const consents = latestConsents(consentListData);
	const isChecked = (consent: Consent) => checked[consent.id] ?? consent.status === 'granted';
	const allChecked = Boolean(consents.length) && consents.every(isChecked);

	useFocusEffect(
		useCallback(() => {
			if (agreedIds.length === 0) {
				return;
			}

			setChecked((prev) => ({
				...prev,
				...Object.fromEntries(agreedIds.map((id) => [id, true])),
			}));

			clearAgreedIds();
		}, [agreedIds, clearAgreedIds]),
	);

	async function saveDecisions(items: readonly Consent[]) {
		for (const consent of items) {
			await mutateAsync({
				data: {
					consent_id: consent.id,
					status: isChecked(consent) ? 'granted' : 'denied',
				},
			});
		}
	}

	function save() {
		if (isPending) {
			return;
		}

		saveDecisions(consents).then(
			() => onSaved?.(),
			() => null,
		);
	}

	return {
		consents,
		isChecked,
		toggle: (consent) => setChecked((current) => ({ ...current, [consent.id]: !isChecked(consent) })),
		allChecked,
		toggleAll: () => setChecked(Object.fromEntries(consents.map((consent) => [consent.id, !allChecked]))),
		ready: consents.every((consent) => !consent.is_required || isChecked(consent)),
		saving: isPending,
		saveFailed: isSaveError,
		save,
	};
}
