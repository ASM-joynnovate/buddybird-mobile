import type { IdempotentIdParams, IdempotentParams } from '@/types/apis/common';
import {
	type Device,
	deviceSchema,
	type PatchDeviceParams,
	type PutDeviceParams,
	type PutPushTokenParams,
} from '@/types/apis/devices';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getDeviceList = async (): Promise<Device[]> => {
	const { data: devices } = await apiRequest('/api/v1/devices', z.array(deviceSchema));

	return devices;
};

export const putDevice = async ({ data, idempotencyKey }: PutDeviceParams): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices', deviceSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const putPushToken = async ({ data, idempotencyKey }: PutPushTokenParams): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices/me/push-token', deviceSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const putDeviceActivity = async ({ idempotencyKey }: IdempotentParams): Promise<void> => {
	await apiRequest('/api/v1/devices/me/activity', z.unknown(), { method: 'PUT', idempotencyKey });
};

export const patchDevice = async ({ data, idempotencyKey }: PatchDeviceParams): Promise<Device> => {
	const { data: device } = await apiRequest('/api/v1/devices/me', deviceSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return device;
};

export const deleteDevice = async ({ id, idempotencyKey }: IdempotentIdParams): Promise<void> => {
	await apiRequest(`/api/v1/devices/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
};
