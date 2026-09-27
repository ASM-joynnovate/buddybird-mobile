import * as AppleAuthentication from "expo-apple-authentication"
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto"

import { env } from "@/config"
import { authClient, openAuthSession, requestAppleCredential } from "@/services/auth/client"
import { setAppleCredential } from "@/services/auth/credential"
import { useAccountStore } from "@/stores/account"
import type { LoginProvider } from "@/types/account"

type LinkResult = "linked" | "exists" | "cancelled"

type OAuthProvider = Exclude<LoginProvider, "apple">

function redirectTo() {
	return `${env.production ? "buddybird" : "buddybird-dev"}://auth/callback`
}

function oauthOptions(provider: OAuthProvider) {
	return {
		redirectTo: redirectTo(),
		skipBrowserRedirect: true,
		...(provider === "google"
			? { queryParams: { access_type: "offline", prompt: "consent" } }
			: {}),
	}
}

async function appleIdToken() {
	const nonce = randomUUID()
	const credential = await requestAppleCredential({
		nonce: await digestStringAsync(CryptoDigestAlgorithm.SHA256, nonce),
		requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
	})

	if (!credential.identityToken) {
		throw new Error("Apple identity token missing")
	}

	if (credential.authorizationCode) {
		setAppleCredential(credential.authorizationCode)
	}

	return { provider: "apple" as const, token: credential.identityToken, nonce }
}

async function browserCallback(url: string): Promise<URL | null> {
	const redirect = redirectTo()
	const result = await openAuthSession(url, redirect)

	if (result.type === "cancel" || result.type === "dismiss") {
		return null
	}

	if (result.type !== "success") {
		throw new Error("Authentication browser unavailable")
	}

	const callback = new URL(result.url)
	const expected = new URL(redirect)

	if (
		callback.protocol !== expected.protocol ||
		callback.host !== expected.host ||
		callback.pathname !== expected.pathname ||
		callback.username ||
		callback.password
	) {
		throw new Error("Invalid authentication callback")
	}

	return callback
}

function callbackParam(callback: URL, name: string) {
	return callback.searchParams.get(name) ?? new URLSearchParams(callback.hash.slice(1)).get(name)
}

async function exchangeCallback(callback: URL, provider: OAuthProvider): Promise<boolean> {
	const providerError = callbackParam(callback, "error")

	if (providerError === "access_denied") {
		return false
	}

	const code = callback.searchParams.get("code")

	if (providerError || !code) {
		throw new Error("Authentication code missing")
	}

	useAccountStore.getState().markProvider(provider)

	const { error } = await authClient().exchangeCodeForSession(code)

	if (error) {
		throw error
	}

	return true
}

async function signIn(provider: LoginProvider): Promise<boolean> {
	if (provider === "apple") {
		const credential = await appleIdToken()

		useAccountStore.getState().markProvider(provider)

		const { error } = await authClient().signInWithIdToken(credential)

		if (error) {
			throw error
		}

		return true
	}

	const { data, error } = await authClient().signInWithOAuth({
		provider,
		options: oauthOptions(provider),
	})

	if (error) {
		throw error
	}

	const callback = await browserCallback(data.url)

	return callback ? exchangeCallback(callback, provider) : false
}

export async function linkAccount(provider: LoginProvider): Promise<LinkResult> {
	if (provider === "apple") {
		const credential = await appleIdToken()

		useAccountStore.getState().markProvider(provider)

		const { error } = await authClient().linkIdentity(credential)

		if (error?.code === "identity_already_exists") {
			return "exists"
		}

		if (error) {
			throw error
		}

		return "linked"
	}

	const { data, error } = await authClient().linkIdentity({
		provider,
		options: oauthOptions(provider),
	})

	if (error) {
		throw error
	}

	const callback = await browserCallback(data.url)

	if (!callback) {
		return "cancelled"
	}

	if (callbackParam(callback, "error_code") === "identity_already_exists") {
		return "exists"
	}

	return (await exchangeCallback(callback, provider)) ? "linked" : "cancelled"
}

export async function switchAccount(provider: LoginProvider): Promise<boolean> {
	return signIn(provider)
}
