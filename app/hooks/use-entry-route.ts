import { useGetConsentList } from '@/hooks/apis/consents';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { hasLegacyUpload } from '@/services/migration/upload-legacy';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export type EntryRoute = 'Login' | 'Consent' | 'LegacyUpload' | 'ParrotEditor' | 'UsageGuide' | 'Main';

export function useEntryRoute(): { entryRoute: EntryRoute; parrotId?: string } {
	const { data: consentListData } = useGetConsentList();
	const { data: parrotListData } = useGetParrotList();

	const needsLoginScreen = useAccountStore((account) => account.isAnonymous && !account.loginScreenSeen);
	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted);
	const legacyUploadUnfinished = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus !== 'finished');

	if (needsLoginScreen) {
		return { entryRoute: 'Login' };
	}

	if (consentListData.some((consent) => consent.is_required && consent.status !== 'granted')) {
		return { entryRoute: 'Consent' };
	}

	if (legacyUploadUnfinished && hasLegacyUpload()) {
		return { entryRoute: 'LegacyUpload' };
	}

	if (parrotListData.length === 0) {
		return { entryRoute: 'ParrotEditor' };
	}

	return {
		entryRoute: onboardingCompleted ? 'Main' : 'UsageGuide',
		parrotId: parrotListData[0]?.id,
	};
}
