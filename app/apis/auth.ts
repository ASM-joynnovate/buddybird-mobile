import { mockServer } from "@/mocks/server"
import {
	type Login,
	type LoginRequest,
	loginSchema,
	type MergeRequest,
	withdrawalSchema,
} from "@/types/apis/auth"

export async function completeLogin(_request: LoginRequest, _signal: AbortSignal): Promise<Login> {
	return loginSchema.parse(await mockServer.auth.login())
}

export async function mergeAccount(request: MergeRequest): Promise<void> {
	await mockServer.auth.merge(request.anonymous_access_token)
}

export async function withdraw(): Promise<void> {
	withdrawalSchema.parse(await mockServer.auth.withdraw())
}
