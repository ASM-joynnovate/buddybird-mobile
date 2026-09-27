import { type AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js"

import { withdraw } from "@/apis/auth"
import { setUnauthorizedHandler } from "@/lib/query-client"
import { authClient } from "@/services/auth/client"
import { reportError } from "@/services/telemetry/client"
import { ApiError, UNAUTHORIZED_STATUS } from "@/types/apis/common"

export type AuthIdentity = { id: string; anonymous: boolean }

export type AuthTransition = "signedOut" | "signedIn" | "linked" | "completeLogin"

export function nextAuthState(
	registered: AuthIdentity | null,
	next: AuthIdentity | null,
): AuthTransition {
	if (next === null) {
		return "signedOut"
	}

	if (registered?.id !== next.id) {
		return "completeLogin"
	}

	return registered.anonymous && !next.anonymous ? "linked" : "signedIn"
}

export async function accessToken(): Promise<string> {
	const { data, error } = await authClient().getSession()

	if (isAuthRetryableFetchError(error)) {
		throw new ApiError(0, "CLIENT__NETWORK", error.message)
	}

	if (error) {
		throw new ApiError(UNAUTHORIZED_STATUS, "AUTH__INVALID_TOKEN", error.message)
	}

	if (!data.session) {
		throw new ApiError(UNAUTHORIZED_STATUS, "AUTH__INVALID_TOKEN", "No active session")
	}

	return data.session.access_token
}

export async function signUpAnonymously(): Promise<AuthError | null> {
	const { error } = await authClient().signInAnonymously()

	return error
}

export async function signOutToAnonymous() {
	const { error } = await authClient().signOut({ scope: "local" })

	if (error) {
		throw error
	}
}

export async function withdrawAccount() {
	await withdraw()
	await signOutToAnonymous()
}

let unauthorizedSignOut: Promise<void> | undefined

export function installUnauthorizedSignOut() {
	setUnauthorizedHandler(() => {
		unauthorizedSignOut ??= signOutToAnonymous()
			.catch((error: unknown) => reportError(error, "unauthorized_sign_out"))
			.finally(() => {
				unauthorizedSignOut = undefined
			})
	})
}
