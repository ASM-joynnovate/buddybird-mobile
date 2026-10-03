import { type LoginRequest, type LoginResult, loginResultSchema } from '@/types/apis/auth';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const postLogin = async ({
	data,
	signal,
}: {
	data: LoginRequest;
	signal: AbortSignal;
}): Promise<LoginResult> => {
	const { data: loginResult } = await apiRequest('/api/v1/auth/login', loginResultSchema, {
		method: 'POST',
		json: data,
		signal,
	});

	return loginResult;
};

export const postLogout = async (): Promise<void> => {
	await apiRequest('/api/v1/auth/logout', z.unknown(), { method: 'POST' });
};

export const withdrawal = async (): Promise<void> => {
	await apiRequest('/api/v1/auth/withdrawal', z.unknown(), { method: 'DELETE' });
};
