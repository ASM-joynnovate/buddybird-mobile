import { mockPutLocale } from '@/apis/mock';

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

const deviceId = () => useAccountStore.getState().clientDeviceId ?? '';
const locale = () => useDeviceSettingsStore.getState().locale;

configureApi({ deviceId, locale, accessToken, reportError });

installUnauthorizedSignOut();

mockPutLocale({ locale });

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, 'splash_screen'));

// Register the translation instance before the first useTranslation hook renders.
const i18nReady = changeI18nLocale(useDeviceSettingsStore.getState().locale);

export async function bootstrap() {
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
	} catch (error) {
		reportError(error, 'legacy_load');
	}

	return 'ready' as const;
}
