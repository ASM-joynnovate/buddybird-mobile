import { useGetConsentList } from '@/hooks/apis/consents';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { hasLegacyUpload } from '@/services/migration/upload-legacy';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export type EntryRoute = 'Login' | 'Consent' | 'LegacyUpload' | 'ParrotEditor' | 'UsageGuide' | 'Main';

/** 온보딩 진행 상태에 맞는 첫 화면 결정 Hook */
const useEntryRoute = (): { entryRoute: EntryRoute; parrotId?: string } => {
	const { data: consentListData } = useGetConsentList();
	const { data: parrotListData } = useGetParrotList();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);
	const loginScreenSeen = useAccountStore((state) => state.loginScreenSeen);

	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted);
	const uploadStatus = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus);

	const needsLoginScreen = isAnonymous && !loginScreenSeen;
	const legacyUploadUnfinished = uploadStatus !== 'finished';

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
};

export default useEntryRoute;
