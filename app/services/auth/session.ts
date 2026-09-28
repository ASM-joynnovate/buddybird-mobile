import { ApiError, UNAUTHORIZED_STATUS } from '@/types/apis/common';

import { setUnauthorizedHandler } from '@/lib/query-client';

import { type AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { authClient } from '@/services/auth/client';
import { reportError } from '@/services/telemetry/client';

export type AuthIdentity = { id: string; anonymous: boolean };

type AuthTransition = 'signedOut' | 'signedIn' | 'linked' | 'userChanged';

export function getAuthTransition(
	registeredIdentity: AuthIdentity | null,
	nextIdentity: AuthIdentity | null,
): AuthTransition {
	if (nextIdentity === null) {
		return 'signedOut';
	}

	if (registeredIdentity?.id !== nextIdentity.id) {
		return 'userChanged';
	}

	return registeredIdentity.anonymous && !nextIdentity.anonymous ? 'linked' : 'signedIn';
}

export async function accessToken(): Promise<string> {
	const { data, error } = await authClient().getSession();

	if (isAuthRetryableFetchError(error)) {
		throw new ApiError(0, 'CLIENT__NETWORK', error.message);
	}

	if (error) {
		throw new ApiError(UNAUTHORIZED_STATUS, 'AUTH__INVALID_TOKEN', error.message);
	}

	if (!data.session) {
		throw new ApiError(UNAUTHORIZED_STATUS, 'AUTH__INVALID_TOKEN', 'No active session');
	}

	return data.session.access_token;
}

export async function signUpAnonymously(): Promise<AuthError | null> {
	const { error } = await authClient().signInAnonymously();

	return error;
}

export async function signOutLocally() {
	const { error } = await authClient().signOut({ scope: 'local' });

	if (error) {
		throw error;
	}
}

let unauthorizedSignOut: Promise<void> | undefined;

export function installUnauthorizedSignOut() {
	setUnauthorizedHandler(() => {
		unauthorizedSignOut ??= signOutLocally()
			.catch((error: unknown) => reportError(error, 'unauthorized_sign_out'))
			.finally(() => {
				unauthorizedSignOut = undefined;
			});
	});
}
