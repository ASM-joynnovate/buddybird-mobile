import { ApiError, UNAUTHORIZED_STATUS } from '@/types/apis/common';

import { setUnauthorizedHandler } from '@/lib/query-client';
import { getSupabase } from '@/lib/supabase';

import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { reportError } from '@/services/telemetry/client';

export interface AuthIdentity {
	id: string;
	anonymous: boolean;
}

/** 로그인 사용자 변화의 종류를 반환하는 함수 */
export const getAuthTransition = (registeredIdentity: AuthIdentity | null, nextIdentity: AuthIdentity | null) => {
	if (nextIdentity === null) {
		return 'signedOut';
	}

	if (registeredIdentity?.id !== nextIdentity.id) {
		return 'userChanged';
	}

	return registeredIdentity.anonymous && !nextIdentity.anonymous ? 'linked' : 'signedIn';
};

/** 현재 세션의 액세스 토큰을 반환하는 함수 */
export const accessToken = async () => {
	const { data: sessionData, error } = await getSupabase().auth.getSession();

	if (isAuthRetryableFetchError(error)) {
		throw new ApiError(0, 'CLIENT__NETWORK', error.message);
	}

	if (error) {
		throw new ApiError(UNAUTHORIZED_STATUS, 'AUTH__INVALID_TOKEN', error.message);
	}

	if (!sessionData.session) {
		throw new ApiError(UNAUTHORIZED_STATUS, 'AUTH__INVALID_TOKEN', 'No active session');
	}

	return sessionData.session.access_token;
};

/** 익명 로그인 함수 */
export const signUpAnonymously = async () => {
	const { error } = await getSupabase().auth.signInAnonymously();

	return error;
};

/** 이 기기에서만 로그아웃하는 함수 */
export const signOutLocally = async () => {
	const { error } = await getSupabase().auth.signOut({ scope: 'local' });

	if (error) {
		throw error;
	}
};

let unauthorizedSignOut: Promise<void> | undefined;

/** 인증 실패 시 로그아웃하도록 등록하는 함수 */
export const installUnauthorizedSignOut = () => {
	setUnauthorizedHandler(() => {
		unauthorizedSignOut ??= signOutLocally()
			.catch((error: unknown) => reportError(error, 'unauthorized_sign_out'))
			.finally(() => {
				unauthorizedSignOut = undefined;
			});
	});
};
