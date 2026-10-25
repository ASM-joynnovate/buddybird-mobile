import type { EntryRoute } from '@/types/navigation';

import { useGetConsentList } from '@/hooks/apis/consents';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { getPendingLegacyUpload } from '@/services/migration/upload-legacy';
import { useAuthStore } from '@/stores/auth';
import { useDeviceSettingsStore } from '@/stores/device-settings';

interface EntryRouteResult {
	entryRoute: EntryRoute;
	parrotId?: string;
}

/** 온보딩 진행 상태에 맞는 첫 화면 결정 Hook */
const useEntryRoute = (): EntryRouteResult => {
	const { data: consentListData } = useGetConsentList();
	const { data: parrotListData } = useGetParrotList();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);
	const loginScreenSeen = useAuthStore((state) => state.loginScreenSeen);

	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted);
	const uploadStatus = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus);

	const shouldShowLoginScreen = isAnonymous && !loginScreenSeen;
	const legacyUploadUnfinished = uploadStatus !== 'finished';

	if (shouldShowLoginScreen) {
		return { entryRoute: 'Login' };
	}

	if (consentListData.some((consent) => consent.is_required && consent.status !== 'granted')) {
		return { entryRoute: 'Consent' };
	}

	if (legacyUploadUnfinished && getPendingLegacyUpload() !== null) {
		return { entryRoute: 'LegacyUpload' };
	}

	if (onboardingCompleted) {
		return { entryRoute: 'Main' };
	}

	if (parrotListData.length === 0) {
		return { entryRoute: 'ParrotEditor' };
	}

	return { entryRoute: 'PermissionRequest', parrotId: parrotListData[0]?.id };
};

export default useEntryRoute;
