import { ApiError, UNAUTHORIZED_STATUS } from '@/types/apis/common';

import { setUnauthorizedHandler } from '@/lib/query-client';

import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { authClient } from '@/services/auth/client';
import { reportError } from '@/services/telemetry/client';

export interface AuthIdentity {
	id: string;
	anonymous: boolean;
}

/** 저장된 사용자와 새 세션의 사용자를 비교해 로그아웃, 사용자 변경, 계정 연결, 로그인 유지 가운데 하나로 구분 */
export const getAuthTransition = (registeredIdentity: AuthIdentity | null, nextIdentity: AuthIdentity | null) => {
	if (nextIdentity === null) {
		return 'signedOut';
	}

	if (registeredIdentity?.id !== nextIdentity.id) {
		return 'userChanged';
	}

	return registeredIdentity.anonymous && !nextIdentity.anonymous ? 'linked' : 'signedIn';
};

/** 서버 요청에 넣을 지금 세션의 액세스 토큰, 세션이 없거나 읽지 못하면 ApiError */
export const accessToken = async () => {
	const { data: sessionData, error } = await authClient().getSession();

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

/** 익명 로그인, 실패하면 인증 오류 반환 */
export const signUpAnonymously = async () => {
	const { error } = await authClient().signInAnonymously();

	return error;
};

/** 이 기기의 세션만 로그아웃 */
export const signOutLocally = async () => {
	const { error } = await authClient().signOut({ scope: 'local' });

	if (error) {
		throw error;
	}
};

let unauthorizedSignOut: Promise<void> | undefined;

/** 서버 요청이 인증 실패로 끝나면 이 기기에서 한 번만 로그아웃하도록 등록 */
export const installUnauthorizedSignOut = () => {
	setUnauthorizedHandler(() => {
		unauthorizedSignOut ??= signOutLocally()
			.catch((error: unknown) => reportError(error, 'unauthorized_sign_out'))
			.finally(() => {
				unauthorizedSignOut = undefined;
			});
	});
};
