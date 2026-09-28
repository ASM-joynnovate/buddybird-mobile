import { useGetConsentList } from '@/hooks/apis/consents';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { hasLegacyUpload } from '@/services/migration/upload-legacy';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export type EntryRoute = 'Login' | 'Consent' | 'LegacyUpload' | 'ParrotEditor' | 'UsageGuide' | 'Main';

/** 로그인, 필수 동의, v1 올리기, 앵무새 등록, 사용 안내 완료 여부로 첫 화면을 정하는 훅 */
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
