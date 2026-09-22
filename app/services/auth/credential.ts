import * as Application from "expo-application"

import { getSupabase } from "@/lib/supabase"
import { useAccountStore } from "@/stores/account"
import type { LoginRequest } from "@/types/apis/auth"

type LoginCredential = Pick<LoginRequest, "google" | "apple">

let appleCredential: LoginCredential | undefined

export function setAppleCredential(authorizationCode: string) {
	const clientId = Application.applicationId

	if (clientId) {
		appleCredential = { apple: { client_id: clientId, authorization_code: authorizationCode } }
	}
}

export function takeCredential(): LoginCredential | undefined {
	const credential = appleCredential

	appleCredential = undefined

	return credential
}

export async function loginCredential(): Promise<LoginCredential> {
	const { provider } = useAccountStore.getState()

	if (provider === "apple") {
		return takeCredential() ?? {}
	}

	if (provider !== "google") {
		return {}
	}

	const { data, error } = await getSupabase().auth.getSession()

	if (error) {
		throw error
	}

	const refreshToken = data.session?.provider_refresh_token

	return refreshToken ? { google: { refresh_token: refreshToken } } : {}
}
