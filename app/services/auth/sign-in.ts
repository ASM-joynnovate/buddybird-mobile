import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

import { env } from '@/config';
import { authClient, openAuthSession, requestAppleCredential } from '@/services/auth/client';
import { setAppleLoginCredential } from '@/services/auth/credential';
import { useAccountStore } from '@/stores/account';

type OAuthProvider = Exclude<LoginProvider, 'apple'>;

/** 로그인 브라우저가 앱으로 돌아올 주소 */
const authRedirectUrl = () => {
	return `${env.isProduction ? 'buddybird' : 'buddybird-dev'}://auth/callback`;
};

/** 로그인 브라우저 요청 옵션, Google은 갱신 토큰을 받도록 동의 화면 요청 */
const oauthOptions = (provider: OAuthProvider) => {
	return {
		redirectTo: authRedirectUrl(),
		skipBrowserRedirect: true,
		...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}),
	};
};

/** Apple 로그인으로 ID 토큰을 받고 인증 코드는 서버 로그인 요청에 보내도록 저장 */
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

/** 로그인 브라우저를 열어 돌아온 주소, 취소하면 null, 앱 주소가 아니면 오류 */
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

/** 돌아온 주소의 searchParams나 hash에서 이름으로 찾은 값 */
const callbackParam = (callbackUrl: URL, name: string) => {
	return callbackUrl.searchParams.get(name) ?? new URLSearchParams(callbackUrl.hash.slice(1)).get(name);
};

/** 돌아온 주소의 인증 코드를 세션으로 교환, 사용자가 거부하면 false */
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

/** 고른 방식으로 로그인, 사용자가 취소하면 false */
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

/** 지금 계정에 고른 로그인 방식 연결, 다른 계정에 이미 연결된 방식이면 identityExists, 취소하면 cancelled */
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
