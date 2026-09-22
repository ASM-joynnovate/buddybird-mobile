import { mockServer } from "@/apis/mock/server"
import { type Emergency, emergencySchema } from "@/mocks/types"

export async function fetchEmergency(id: string): Promise<Emergency> {
	return emergencySchema.parse(await mockServer.emergencies.get(id))
}

export async function confirmEmergency(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.emergencies.confirm(id)
}

export async function deleteEmergency(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.emergencies.remove(id)
}
