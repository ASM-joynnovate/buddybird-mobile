import { Platform } from 'react-native';

import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { getLocales } from 'expo-localization';

import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';

/** 기기 언어와 지역, 마지막 로그인 방식, 플랫폼에 따라 로그인 화면에 보여 줄 로그인 방식 목록 */
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
