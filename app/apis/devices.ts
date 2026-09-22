import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

const deviceSchema = z.object({
	id: z.uuid(),
	name: z.string().nullable(),
	model: z.string(),
	platform: z.enum(["ios", "android"]),
	last_seen_at: z.iso.datetime({ offset: true }).nullable(),
	is_current: z.boolean(),
	is_running_session: z.boolean(),
})

export type Device = z.infer<typeof deviceSchema>

export async function fetchDevices(): Promise<Device[]> {
	return z.array(deviceSchema).parse(await mockServer.devices.list())
}

export async function renameDevice(
	id: string,
	name: string | null,
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.devices.rename(id, name)
}

export async function disconnectDevice(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.devices.disconnect(id)
}

export async function registerPushToken(token: string, _idempotencyKey: string): Promise<void> {
	await mockServer.devices.registerPushToken(token)
}
