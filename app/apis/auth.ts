import * as Application from "expo-application"
import { z } from "zod"

import { apiRequest } from "@/lib/api"
import { getSupabase } from "@/lib/supabase"
import { loginProvider } from "@/services/auth/registration"

type LoginCredential =
	| { google: { refresh_token: string } }
	| { apple: { client_id: string; authorization_code: string } }

const loginSchema = z.object({ user_id: z.uuid(), is_new_user: z.boolean() })

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

export async function completeLogin(signal: AbortSignal) {
	const { data } = await apiRequest("/api/v1/auth/login", loginSchema, {
		method: "POST",
		signal,
		json: await loginCredential(),
	})

	appleCredential = undefined

	return data
}

async function loginCredential(): Promise<LoginCredential | undefined> {
	const provider = loginProvider()

	if (provider === "apple") {
		return appleCredential
	}

	if (provider !== "google") {
		return undefined
	}

	const { data, error } = await getSupabase().auth.getSession()

	if (error) {
		throw error
	}

	const refreshToken = data.session?.provider_refresh_token

	return refreshToken ? { google: { refresh_token: refreshToken } } : undefined
}
