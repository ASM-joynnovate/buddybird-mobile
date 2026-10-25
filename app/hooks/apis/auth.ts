import { useMutation } from '@tanstack/react-query';

import { postLogin, postLogout, deleteWithdrawal } from '@/apis/auth';

import { apiKeys } from '@/hooks/apis/keys';

import { signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';

/** 로그인 Hook */
export const useLogin = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('auth', 'login'),
		mutationFn: postLogin,
		retry: false,
		meta: { skipUnauthorizedSignOut: true },
	});
};

/** 로그아웃 Hook */
export const useLogout = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('auth', 'logout'),
		mutationFn: postLogout,
		onError: (error) => reportError(error, 'sign_out'),
	});
};

/** 회원 탈퇴 Hook */
export const useWithdraw = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('auth', 'withdraw'),
		mutationFn: deleteWithdrawal,
		onSuccess: () => signOutLocally().catch((error: unknown) => reportError(error, 'withdraw')),
		onError: (error) => reportError(error, 'withdraw'),
	});
};
