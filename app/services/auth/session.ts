import { isAuthRetryableFetchError } from "@supabase/supabase-js"

import { setUnauthorizedHandler } from "@/lib/query-client"
import { getSupabase } from "@/lib/supabase"
import { ApiError } from "@/types/apis/common"

export type AuthTransition = "unchanged" | "signedOut" | "signedIn" | "completeLogin"

export function nextAuthState(
	previousUserId: string | null | undefined,
	nextUserId: string | null,
	registeredUser: string | null,
): AuthTransition {
	if (nextUserId === previousUserId) {
		return "unchanged"
	}

	if (nextUserId === null) {
		return "signedOut"
	}

	return nextUserId === registeredUser ? "signedIn" : "completeLogin"
}

export async function accessToken(): Promise<string> {
	const { data, error } = await getSupabase().auth.getSession()

	if (isAuthRetryableFetchError(error)) {
		throw new ApiError(0, "CLIENT__NETWORK", error.message)
	}

	if (error) {
		throw new ApiError(401, "AUTH__INVALID_TOKEN", error.message)
	}

	if (!data.session) {
		throw new ApiError(401, "AUTH__INVALID_TOKEN", "No active session")
	}

	return data.session.access_token
}

export async function signOut() {
	const { error } = await getSupabase().auth.signOut({ scope: "local" })

	if (error) {
		throw error
	}
}

export function installUnauthorizedSignOut() {
	setUnauthorizedHandler(() => void getSupabase().auth.signOut({ scope: "local" }))
}
