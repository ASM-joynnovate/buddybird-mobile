import { type Device, deviceSchema, type RegisterDeviceRequest } from '@/types/apis/devices';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getDeviceList = async (): Promise<Device[]> => {
	return z.array(deviceSchema).parse(await mockServer.devices.list());
};

export const putDevice = async ({
	data,
	idempotencyKey,
}: {
	data: RegisterDeviceRequest;
	idempotencyKey: string;
}): Promise<Device> => {
	return deviceSchema.parse(await mockServer.devices.register(data));
};

export const putPushToken = async ({
	data,
	idempotencyKey,
}: {
	data: { token: string };
	idempotencyKey: string;
}): Promise<Device> => {
	return deviceSchema.parse(await mockServer.devices.updatePushToken(data.token));
};
