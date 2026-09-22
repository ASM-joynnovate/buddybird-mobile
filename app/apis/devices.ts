import { z } from "zod"

import { mockServer } from "@/apis/mock/server"
import {
	type Device,
	deviceSchema,
	type RegisterDeviceRequest,
	type UpdateDeviceRequest,
} from "@/types/apis/devices"

export async function fetchDevices(): Promise<Device[]> {
	return z.array(deviceSchema).parse(await mockServer.devices.list())
}

export async function registerDevice(
	input: RegisterDeviceRequest,
	_idempotencyKey: string,
): Promise<Device> {
	return deviceSchema.parse(await mockServer.devices.register(input))
}

export async function updateDevice(
	input: UpdateDeviceRequest,
	_idempotencyKey: string,
): Promise<Device> {
	return deviceSchema.parse(await mockServer.devices.updateMe(input))
}

export async function disconnectMe(_idempotencyKey: string): Promise<void> {
	await mockServer.devices.disconnectMe()
}

export async function registerPushToken(token: string, _idempotencyKey: string): Promise<Device> {
	return deviceSchema.parse(await mockServer.devices.updatePushToken(token))
}
