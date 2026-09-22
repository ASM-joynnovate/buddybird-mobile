import { isAuthRetryableFetchError } from "@supabase/supabase-js"

import { setUnauthorizedHandler } from "@/lib/query-client"
import { getSupabase } from "@/lib/supabase"
import { ApiError } from "@/types/apis/common"

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

export function installUnauthorizedSignOut() {
	setUnauthorizedHandler(() => void getSupabase().auth.signOut({ scope: "local" }))
}
