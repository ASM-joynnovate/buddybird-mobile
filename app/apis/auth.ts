import { type LoginResult, loginResultSchema, type PostLoginParams } from '@/types/apis/auth';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const postLogin = async ({ data, signal }: PostLoginParams): Promise<LoginResult> => {
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

export const deleteWithdrawal = async (): Promise<void> => {
	await apiRequest('/api/v1/auth/withdrawal', z.unknown(), { method: 'DELETE' });
};
