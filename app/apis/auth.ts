import { mockServer } from "@/mocks/server"
import { type Login, type LoginRequest, loginSchema, withdrawalSchema } from "@/types/apis/auth"

export async function completeLogin(_request: LoginRequest, _signal: AbortSignal): Promise<Login> {
	return loginSchema.parse(await mockServer.auth.login())
}

export async function logout(): Promise<void> {
	await mockServer.auth.logout()
}

export async function withdraw(): Promise<void> {
	withdrawalSchema.parse(await mockServer.auth.withdraw())
}
