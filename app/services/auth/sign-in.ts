import * as AppleAuthentication from "expo-apple-authentication"
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto"
import * as WebBrowser from "expo-web-browser"

import { setAppleCredential } from "@/apis/auth"
import { config } from "@/config"
import { getSupabase } from "@/lib/supabase"

export async function signInWithOAuth(provider: "google" | "kakao") {
	const supabase = getSupabase()
	const redirectTo = `${config.production ? "buddybird" : "buddybird-dev"}://auth/callback`
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo,
			skipBrowserRedirect: true,
			...(provider === "google"
				? { queryParams: { access_type: "offline", prompt: "consent" } }
				: {}),
		},
	})

	if (error) {
		throw error
	}

	const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

	if (result.type === "cancel" || result.type === "dismiss") {
		return
	}

	if (result.type !== "success") {
		throw new Error("Authentication browser unavailable")
	}

	const callback = new URL(result.url)
	const expected = new URL(redirectTo)

	if (
		callback.protocol !== expected.protocol ||
		callback.host !== expected.host ||
		callback.pathname !== expected.pathname ||
		callback.username ||
		callback.password
	) {
		throw new Error("Invalid authentication callback")
	}

	const providerError =
		callback.searchParams.get("error") ??
		new URLSearchParams(callback.hash.slice(1)).get("error")

	if (providerError === "access_denied") {
		return
	}

	const code = callback.searchParams.get("code")

	if (providerError || !code) {
		throw new Error("Authentication code missing")
	}

	const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

	if (exchangeError) {
		throw exchangeError
	}
}

export async function signInWithApple() {
	const supabase = getSupabase()
	const nonce = randomUUID()
	const credential = await AppleAuthentication.signInAsync({
		nonce: await digestStringAsync(CryptoDigestAlgorithm.SHA256, nonce),
		requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
	})

	if (!credential.identityToken) {
		throw new Error("Apple identity token missing")
	}

	if (credential.authorizationCode) {
		setAppleCredential(credential.authorizationCode)
	}

	const { error } = await supabase.auth.signInWithIdToken({
		provider: "apple",
		token: credential.identityToken,
		nonce,
	})

	if (error) {
		throw error
	}
}
