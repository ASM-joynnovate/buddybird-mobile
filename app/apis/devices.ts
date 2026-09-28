import { type Device, deviceSchema, type RegisterDeviceRequest } from '@/types/apis/devices';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export async function fetchDevices(): Promise<Device[]> {
	return z.array(deviceSchema).parse(await mockServer.devices.list());
}

export async function registerDevice(input: RegisterDeviceRequest, _idempotencyKey: string): Promise<Device> {
	return deviceSchema.parse(await mockServer.devices.register(input));
}

export async function registerPushToken(token: string, _idempotencyKey: string): Promise<Device> {
	return deviceSchema.parse(await mockServer.devices.updatePushToken(token));
}
