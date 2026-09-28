import { useGetConsentList } from '@/hooks/apis/consents';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { hasLegacyUpload } from '@/services/migration/upload-legacy';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export type EntryRoute = 'Login' | 'Consent' | 'LegacyUpload' | 'ParrotEditor' | 'UsageGuide' | 'Main';

export function useEntryRoute(): { route: EntryRoute; parrotId?: string } {
	const { data: consentListData } = useGetConsentList();
	const { data: parrotListData } = useGetParrotList();

	const loginPending = useAccountStore((account) => account.isAnonymous && !account.loginScreenSeen);
	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted);
	const legacyUploadPending = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus !== 'finished');

	if (loginPending) {
		return { route: 'Login' };
	}

	if (consentListData.some((consent) => consent.is_required && consent.status !== 'granted')) {
		return { route: 'Consent' };
	}

	if (legacyUploadPending && hasLegacyUpload()) {
		return { route: 'LegacyUpload' };
	}

	if (parrotListData.length === 0) {
		return { route: 'ParrotEditor' };
	}

	return {
		route: onboardingCompleted ? 'Main' : 'UsageGuide',
		parrotId: parrotListData[0]?.id,
	};
}
