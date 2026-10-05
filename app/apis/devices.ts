import { type Device, deviceSchema, type RegisterDeviceRequest, type UpdateDeviceRequest } from '@/types/apis/devices';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getDeviceList = async (): Promise<Device[]> => {
	const { data: devices } = await apiRequest('/api/v1/devices', z.array(deviceSchema));

	return devices;
};

export const putDevice = async ({
	data,
	idempotencyKey,
}: {
	data: RegisterDeviceRequest;
	idempotencyKey: string;
}): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices', deviceSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const putPushToken = async ({
	data,
	idempotencyKey,
}: {
	data: { token: string };
	idempotencyKey: string;
}): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices/me/push-token', deviceSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const patchDevice = async ({
	data,
	idempotencyKey,
}: {
	data: UpdateDeviceRequest;
	idempotencyKey: string;
}): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices/me', deviceSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const deleteDevice = async ({ id, idempotencyKey }: { id: string; idempotencyKey: string }): Promise<void> => {
	await apiRequest(`/api/v1/devices/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
};
