import { useQuery } from '@tanstack/react-query';

import { getConsentListOptions } from '@/hooks/apis/consents';
import { getParrotListOptions } from '@/hooks/apis/parrots';

import { hasLegacyUpload } from '@/services/migration/upload-legacy';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export type EntryRoute =
	| 'loading'
	| 'error'
	| 'Login'
	| 'Consent'
	| 'LegacyUpload'
	| 'ParrotEditor'
	| 'UsageGuide'
	| 'Main';

export function useEntryRoute(): { route: EntryRoute; parrotId?: string; retry(): void } {
	const {
		data: consentListData,
		isError: consentListFailed,
		refetch: refetchConsentList,
	} = useQuery(getConsentListOptions());
	const {
		data: parrotListData,
		isError: parrotListFailed,
		refetch: refetchParrotList,
	} = useQuery(getParrotListOptions());

	const loginPending = useAccountStore((account) => account.isAnonymous && !account.loginScreenSeen);
	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted);
	const legacyUploadPending = useDeviceSettingsStore((state) => state.legacyMigration.upload !== 'finished');

	function retry() {
		void refetchConsentList();
		void refetchParrotList();
	}

	if (loginPending) {
		return { route: 'Login', retry };
	}

	if (consentListFailed || parrotListFailed) {
		return { route: 'error', retry };
	}

	if (!consentListData || !parrotListData) {
		return { route: 'loading', retry };
	}

	if (consentListData.some((consent) => consent.is_required && consent.status !== 'granted')) {
		return { route: 'Consent', retry };
	}

	if (legacyUploadPending && hasLegacyUpload()) {
		return { route: 'LegacyUpload', retry };
	}

	if (parrotListData.length === 0) {
		return { route: 'ParrotEditor', retry };
	}

	return {
		route: onboardingCompleted ? 'Main' : 'UsageGuide',
		parrotId: parrotListData[0]?.id,
		retry,
	};
}
