import { apiRequest } from "@/lib/api"
import { type Login, type LoginRequest, loginSchema, withdrawalSchema } from "@/types/apis/auth"

export async function completeLogin(request: LoginRequest, signal: AbortSignal): Promise<Login> {
	const { data } = await apiRequest("/api/v1/auth/login", loginSchema, {
		method: "POST",
		signal,
		json: request,
	})

	return data
}

export async function withdraw(): Promise<void> {
	await apiRequest("/api/v1/auth/withdrawal", withdrawalSchema, { method: "DELETE" })
}
