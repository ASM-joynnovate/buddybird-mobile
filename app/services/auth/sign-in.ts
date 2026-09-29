import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

import { env } from '@/config';
import { authClient, openAuthSession, requestAppleCredential } from '@/services/auth/client';
import { setAppleLoginCredential } from '@/services/auth/credential';
import { useAccountStore } from '@/stores/account';

type OAuthProvider = Exclude<LoginProvider, 'apple'>;

/** 로그인 후 앱으로 돌아올 주소 */
const authRedirectUrl = () => {
	return `${env.isProduction ? 'buddybird' : 'buddybird-dev'}://auth/callback`;
};

/** 로그인 브라우저 요청 옵션 */
const oauthOptions = (provider: OAuthProvider) => {
	return {
		redirectTo: authRedirectUrl(),
		skipBrowserRedirect: true,
		...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}),
	};
};

/** Apple ID 토큰 요청 함수 */
const requestAppleIdToken = async () => {
	const nonce = randomUUID();
	const credential = await requestAppleCredential({
		nonce: await digestStringAsync(CryptoDigestAlgorithm.SHA256, nonce),
		requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
	});

	if (!credential.identityToken) {
		throw new Error('Apple identity token missing');
	}

	if (credential.authorizationCode) {
		setAppleLoginCredential(credential.authorizationCode);
	}

	return { provider: 'apple' as const, token: credential.identityToken, nonce };
};

/** 로그인 브라우저를 열고 돌아온 주소를 반환하는 함수 */
const openAuthBrowser = async (url: string) => {
	const redirectUrl = authRedirectUrl();
	const authSessionResult = await openAuthSession(url, redirectUrl);

	if (authSessionResult.type === 'cancel' || authSessionResult.type === 'dismiss') {
		return null;
	}

	if (authSessionResult.type !== 'success') {
		throw new Error('Authentication browser unavailable');
	}

	const callbackUrl = new URL(authSessionResult.url);
	const expected = new URL(redirectUrl);

	if (
		callbackUrl.protocol !== expected.protocol ||
		callbackUrl.host !== expected.host ||
		callbackUrl.pathname !== expected.pathname ||
		callbackUrl.username ||
		callbackUrl.password
	) {
		throw new Error('Invalid authentication callback');
	}

	return callbackUrl;
};

/** 돌아온 주소에서 파라미터 값을 찾는 함수 */
const callbackParam = (callbackUrl: URL, name: string) => {
	return callbackUrl.searchParams.get(name) ?? new URLSearchParams(callbackUrl.hash.slice(1)).get(name);
};

/** 돌아온 주소의 인증 코드를 세션으로 교환하는 함수 */
const exchangeCallback = async (callbackUrl: URL, provider: OAuthProvider) => {
	const providerError = callbackParam(callbackUrl, 'error');

	if (providerError === 'access_denied') {
		return false;
	}

	const code = callbackUrl.searchParams.get('code');

	if (providerError || !code) {
		throw new Error('Authentication code missing');
	}

	useAccountStore.getState().setLoginProvider(provider);

	const { error } = await authClient().exchangeCodeForSession(code);

	if (error) {
		throw error;
	}

	return true;
};

/** 소셜 로그인 함수 */
export const signIn = async (provider: LoginProvider) => {
	if (provider === 'apple') {
		const idTokenCredentials = await requestAppleIdToken();

		useAccountStore.getState().setLoginProvider(provider);

		const { error } = await authClient().signInWithIdToken(idTokenCredentials);

		if (error) {
			throw error;
		}

		return true;
	}

	const { data: oauthData, error } = await authClient().signInWithOAuth({
		provider,
		options: oauthOptions(provider),
	});

	if (error) {
		throw error;
	}

	const callbackUrl = await openAuthBrowser(oauthData.url);

	return callbackUrl ? exchangeCallback(callbackUrl, provider) : false;
};

/** 현재 계정에 소셜 계정을 연결하는 함수 */
export const linkAccount = async (provider: LoginProvider) => {
	if (provider === 'apple') {
		const idTokenCredentials = await requestAppleIdToken();

		useAccountStore.getState().setLoginProvider(provider);

		const { error } = await authClient().linkIdentity(idTokenCredentials);

		if (error?.code === 'identity_already_exists') {
			return 'identityExists';
		}

		if (error) {
			throw error;
		}

		return 'linked';
	}

	const { data: oauthData, error } = await authClient().linkIdentity({
		provider,
		options: oauthOptions(provider),
	});

	if (error) {
		throw error;
	}

	const callbackUrl = await openAuthBrowser(oauthData.url);

	if (!callbackUrl) {
		return 'cancelled';
	}

	if (callbackParam(callbackUrl, 'error_code') === 'identity_already_exists') {
		return 'identityExists';
	}

	return (await exchangeCallback(callbackUrl, provider)) ? 'linked' : 'cancelled';
};
