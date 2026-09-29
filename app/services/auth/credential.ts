import type { LoginRequest } from '@/types/apis/auth';

import * as Application from 'expo-application';

import { authClient } from '@/services/auth/client';
import { useAccountStore } from '@/stores/account';

type LoginCredential = Pick<LoginRequest, 'google' | 'apple'>;

let appleLoginCredential: LoginCredential | undefined;

/** Apple 인증 코드를 서버 로그인 요청에 함께 보낼 값으로 저장 */
export const setAppleLoginCredential = (authorizationCode: string) => {
	const clientId = Application.applicationId;

	if (clientId) {
		appleLoginCredential = { apple: { client_id: clientId, authorization_code: authorizationCode } };
	}
};

/** 저장한 Apple 로그인 값을 꺼내고 비우기 */
export const takeAppleLoginCredential = () => {
	const credential = appleLoginCredential;

	appleLoginCredential = undefined;

	return credential;
};

/** 로그인 방식에 맞춰 서버 로그인 요청에 함께 보낼 Apple 인증 코드나 Google 갱신 토큰 */
export const loginCredential = async () => {
	const { loginProvider } = useAccountStore.getState();

	if (loginProvider === 'apple') {
		return takeAppleLoginCredential() ?? {};
	}

	if (loginProvider !== 'google') {
		return {};
	}

	const { data: sessionData, error } = await authClient().getSession();

	if (error) {
		throw error;
	}

	const refreshToken = sessionData.session?.provider_refresh_token;

	return refreshToken ? { google: { refresh_token: refreshToken } } : {};
};
