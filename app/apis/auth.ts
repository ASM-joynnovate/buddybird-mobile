import * as Application from "expo-application"

import { config } from "@/config"
import { HttpError, requestJSON, ResponseError } from "@/lib/http"
import { getSupabase } from "@/lib/supabase"

type LoginCredential =
	| { google: { refresh_token: string } }
	| { apple: { client_id: string; authorization_code: string } }

let appleCredential: LoginCredential | undefined

export function setAppleCredential(authorizationCode: string) {
	const clientId = Application.applicationId

	if (clientId) {
		appleCredential = { apple: { client_id: clientId, authorization_code: authorizationCode } }
	}
}

export function clearLoginCredential() {
	appleCredential = undefined
}

export async function completeLogin(supabaseUserId: string, signal: AbortSignal) {
	const { data, error } = await getSupabase().auth.getSession()

	if (error) {
		throw error
	}

	if (!data.session) {
		throw new HttpError(401, null)
	}

	if (signal.aborted || data.session.user.id !== supabaseUserId) {
		throw new Error("Authentication changed")
	}

	const credential =
		appleCredential ??
		(data.session.provider_refresh_token
			? { google: { refresh_token: data.session.provider_refresh_token } }
			: undefined)

	const response = await requestJSON(`${config.apiBaseUrl}/api/v1/auth/login`, {
		method: "POST",
		signal,
		headers: {
			"Authorization": `Bearer ${data.session.access_token}`,
			"X-BuddyBird-Client": "mobile",
			...(credential ? { "Content-Type": "application/json" } : {}),
		},
		body: credential ? JSON.stringify(credential) : undefined,
	})
	const account = (response as { data?: { user_id?: unknown; is_new_user?: unknown } } | null)
		?.data

	if (
		typeof account?.user_id !== "string" ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(account.user_id) ||
		typeof account.is_new_user !== "boolean"
	) {
		throw new ResponseError()
	}

	appleCredential = undefined

	return { user_id: account.user_id, is_new_user: account.is_new_user }
}
