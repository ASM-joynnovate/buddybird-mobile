import type { LoginRequest } from '@/types/apis/auth';

import { getSupabase } from '@/lib/supabase';

import * as Application from 'expo-application';

import { useAuthStore } from '@/stores/auth';

let appleLoginCredential: LoginRequest | undefined;

/** Apple 인증 코드 저장 함수 */
export const setAppleLoginCredential = (authorizationCode: string) => {
	const clientId = Application.applicationId;

	if (clientId) {
		appleLoginCredential = { apple: { client_id: clientId, authorization_code: authorizationCode } };
	}
};

/** 저장한 Apple 인증 코드를 꺼내는 함수 */
export const takeAppleLoginCredential = () => {
	const credential = appleLoginCredential;

	appleLoginCredential = undefined;

	return credential;
};

/** 서버 로그인 요청에 보낼 인증 값을 반환하는 함수 */
export const loginCredential = async () => {
	const { loginProvider } = useAuthStore.getState();

	if (loginProvider === 'apple') {
		return takeAppleLoginCredential() ?? {};
	}

	if (loginProvider !== 'google') {
		return {};
	}

	const { data: sessionData, error } = await getSupabase().auth.getSession();

	if (error) {
		throw error;
	}

	const refreshToken = sessionData.session?.provider_refresh_token;

	return refreshToken ? { google: { refresh_token: refreshToken } } : {};
};
