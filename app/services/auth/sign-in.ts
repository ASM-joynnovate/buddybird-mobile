import type { LoginProvider } from '@/types/account';

import * as AppleAuthentication from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

import { env } from '@/config';
import { authClient, openAuthSession, requestAppleCredential } from '@/services/auth/client';
import { setAppleLoginCredential } from '@/services/auth/credential';
import { useAccountStore } from '@/stores/account';

type LinkResult = 'linked' | 'identityExists' | 'cancelled';

type OAuthProvider = Exclude<LoginProvider, 'apple'>;

function authRedirectUrl() {
	return `${env.isProduction ? 'buddybird' : 'buddybird-dev'}://auth/callback`;
}

function oauthOptions(provider: OAuthProvider) {
	return {
		redirectTo: authRedirectUrl(),
		skipBrowserRedirect: true,
		...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}),
	};
}

async function requestAppleIdToken() {
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
}

async function openAuthBrowser(url: string): Promise<URL | null> {
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
}

function callbackParam(callbackUrl: URL, name: string) {
	return callbackUrl.searchParams.get(name) ?? new URLSearchParams(callbackUrl.hash.slice(1)).get(name);
}

async function exchangeCallback(callbackUrl: URL, provider: OAuthProvider): Promise<boolean> {
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
}

export async function signIn(provider: LoginProvider): Promise<boolean> {
	if (provider === 'apple') {
		const idTokenCredentials = await requestAppleIdToken();

		useAccountStore.getState().setLoginProvider(provider);

		const { error } = await authClient().signInWithIdToken(idTokenCredentials);

		if (error) {
			throw error;
		}

		return true;
	}

	const { data, error } = await authClient().signInWithOAuth({
		provider,
		options: oauthOptions(provider),
	});

	if (error) {
		throw error;
	}

	const callbackUrl = await openAuthBrowser(data.url);

	return callbackUrl ? exchangeCallback(callbackUrl, provider) : false;
}

export async function linkAccount(provider: LoginProvider): Promise<LinkResult> {
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

	const { data, error } = await authClient().linkIdentity({
		provider,
		options: oauthOptions(provider),
	});

	if (error) {
		throw error;
	}

	const callbackUrl = await openAuthBrowser(data.url);

	if (!callbackUrl) {
		return 'cancelled';
	}

	if (callbackParam(callbackUrl, 'error_code') === 'identity_already_exists') {
		return 'identityExists';
	}

	return (await exchangeCallback(callbackUrl, provider)) ? 'linked' : 'cancelled';
}
