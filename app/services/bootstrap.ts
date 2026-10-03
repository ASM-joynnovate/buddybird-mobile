import { changeI18nLocale } from '@/i18n';

import { configureApi } from '@/lib/api';
import { takeRestoreErrors } from '@/lib/storage';

import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import * as SplashScreen from 'expo-splash-screen';

import { accessToken, installUnauthorizedSignOut } from '@/services/auth/session';
import { loadLegacy } from '@/services/migration/upload-legacy';
import { getIsHeadless } from '@/services/push/background';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 서버 요청의 X-Device-Id 헤더에 넣을 이 기기의 ID */
const deviceId = () => useAccountStore.getState().clientDeviceId ?? '';

/** 서버 요청의 Accept-Language 헤더에 넣을 앱 언어 */
const locale = () => useDeviceSettingsStore.getState().locale;

configureApi({ deviceId, locale, accessToken, reportError });

installUnauthorizedSignOut();

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, 'splash_screen'));

// 첫 화면이 useTranslation을 호출하기 전에 i18next 초기화 시작
const i18nReady = changeI18nLocale(useDeviceSettingsStore.getState().locale);

/** 앱 시작 준비 함수 */
export const bootstrap = async () => {
	await i18nReady;

	const restoreErrors = takeRestoreErrors();

	for (const { error, storeName } of restoreErrors) {
		reportError(error, `restore_${storeName}`);
	}

	const { clientDeviceId, setClientDeviceId } = useAccountStore.getState();

	if (!clientDeviceId) {
		setClientDeviceId(randomUUID());
	}

	if (await getIsHeadless()) {
		return 'headless' as const;
	}

	if ((await NetInfo.fetch()).isConnected === false) {
		return 'failed' as const;
	}

	try {
		await loadLegacy();
	} catch (e) {
		reportError(e, 'legacy_load');
	}

	return 'ready' as const;
};
