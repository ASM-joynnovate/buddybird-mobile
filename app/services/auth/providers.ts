import { Platform } from 'react-native';

import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { getLocales } from 'expo-localization';

import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';

/** 사용할 수 있는 로그인 방식 목록을 반환하는 함수 */
export const availableLoginProviders = async (): Promise<LoginProvider[]> => {
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
};
