import type { LoginRequest } from '@/types/apis/auth';

import * as Application from 'expo-application';

import { authClient } from '@/services/auth/client';
import { useAccountStore } from '@/stores/account';

type LoginCredential = Pick<LoginRequest, 'google' | 'apple'>;

let appleLoginCredential: LoginCredential | undefined;

export function setAppleLoginCredential(authorizationCode: string) {
	const clientId = Application.applicationId;

	if (clientId) {
		appleLoginCredential = { apple: { client_id: clientId, authorization_code: authorizationCode } };
	}
}

export function takeAppleLoginCredential(): LoginCredential | undefined {
	const credential = appleLoginCredential;

	appleLoginCredential = undefined;

	return credential;
}

export async function loginCredential(): Promise<LoginCredential> {
	const { loginProvider } = useAccountStore.getState();

	if (loginProvider === 'apple') {
		return takeAppleLoginCredential() ?? {};
	}

	if (loginProvider !== 'google') {
		return {};
	}

	const { data, error } = await authClient().getSession();

	if (error) {
		throw error;
	}

	const refreshToken = data.session?.provider_refresh_token;

	return refreshToken ? { google: { refresh_token: refreshToken } } : {};
}
