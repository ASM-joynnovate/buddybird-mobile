import { Platform } from 'react-native';

import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { getLocales } from 'expo-localization';

import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';

export async function availableLoginProviders(): Promise<LoginProvider[]> {
	const preferredLocale = getLocales()[0];
	const isKoreanLocale = preferredLocale?.regionCode === 'KR' || preferredLocale?.languageCode === 'ko';
	const showKakao = isKoreanLocale || useAccountStore.getState().lastLoginProvider === 'kakao';

	const showApple =
		Platform.OS === 'ios' &&
		(await AppleAuthentication.isAvailableAsync().catch((error: unknown) => {
			reportError(error, 'apple_login_available');

			return false;
		}));

	return ['google', ...(showKakao ? (['kakao'] as const) : []), ...(showApple ? (['apple'] as const) : [])];
}
