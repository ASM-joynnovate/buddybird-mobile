import {
	mockGetIdentityLinked,
	mockGetSession,
	mockPostLinkIdentity,
	mockPostSignIn,
	mockPostSignUp,
	mockPutSessionUser,
} from '@/apis/auth';

import { loginProviderSchema } from '@/types/account';

import {
	AuthApiError,
	type AuthChangeEvent,
	type Session,
	type SignInWithIdTokenCredentials,
	type SignInWithOAuthCredentials,
	type SupabaseClient,
} from '@supabase/supabase-js';
import dayjs from 'dayjs';
import type { AppleAuthenticationCredential, AppleAuthenticationSignInOptions } from 'expo-apple-authentication';
import type { WebBrowserAuthSessionResult } from 'expo-web-browser';

import { useAccountStore } from '@/stores/account';
import { HOUR, SECOND } from '@/utils/units';

type AuthClient = Pick<
	SupabaseClient['auth'],
	| 'getSession'
	| 'onAuthStateChange'
	| 'signInAnonymously'
	| 'linkIdentity'
	| 'signInWithOAuth'
	| 'signInWithIdToken'
	| 'exchangeCodeForSession'
	| 'signOut'
	| 'startAutoRefresh'
	| 'stopAutoRefresh'
>;

type MockSession = ReturnType<typeof mockGetSession>;

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

const IDENTITY_CONFLICT_STATUS = 422;

let listeners = new Set<Listener>();

let activeSession: Session | null | undefined;

function toSession(mock: MockSession): Session {
	return {
		access_token: mock.access_token,
		refresh_token: mock.access_token,
		expires_in: HOUR / SECOND,
		token_type: 'bearer',
		user: {
			id: mock.user_id,
			is_anonymous: mock.is_anonymous,
			aud: 'authenticated',
			app_metadata: { providers: mock.providers },
			user_metadata: {},
			created_at: dayjs().toISOString(),
		},
	};
}

function getActiveSession() {
	if (activeSession === undefined) {
		const { authUserId, isAnonymous } = useAccountStore.getState();

		activeSession = authUserId ? toSession(mockGetSession({ authUserId, isAnonymous })) : null;
	}

	return activeSession;
}

function changeSession(event: AuthChangeEvent, session: Session | null) {
	activeSession = session;

	mockPutSessionUser({ authUserId: session?.user.id ?? null });

	for (const listener of listeners) {
		listener(event, session);
	}
}

async function signInWith(provider: string) {
	const session = toSession(await mockPostSignIn({ provider: loginProviderSchema.parse(provider) }));

	changeSession('SIGNED_IN', session);

	return { data: { user: session.user, session }, error: null };
}

async function linkWith(provider: string) {
	const linkedSession = await mockPostLinkIdentity({ provider: loginProviderSchema.parse(provider) });

	if (!linkedSession) {
		return {
			data: { user: null, session: null },
			error: new AuthApiError(
				'Identity is already linked to another user',
				IDENTITY_CONFLICT_STATUS,
				'identity_already_exists',
			),
		};
	}

	const session = toSession(linkedSession);

	changeSession('USER_UPDATED', session);

	return { data: { user: session.user, session }, error: null };
}

const mockAuth = {
	getSession: async () => ({ data: { session: getActiveSession() }, error: null }),

	onAuthStateChange: (callback: Listener) => {
		listeners = new Set([...listeners, callback]);

		return {
			data: {
				subscription: {
					id: String(listeners.size),
					callback,
					unsubscribe: () => {
						listeners = new Set([...listeners].filter((listener) => listener !== callback));
					},
				},
			},
		};
	},

	signInAnonymously: async () => {
		const session = toSession(await mockPostSignUp());

		changeSession('SIGNED_IN', session);

		return { data: { user: session.user, session }, error: null };
	},

	signInWithOAuth: async ({ provider, options }: SignInWithOAuthCredentials) => ({
		data: { provider, url: `${options?.redirectTo ?? ''}?code=signin.${provider}` },
		error: null,
	}),

	signInWithIdToken: async ({ provider }: SignInWithIdTokenCredentials) => signInWith(provider),

	linkIdentity: async (credentials: SignInWithOAuthCredentials | SignInWithIdTokenCredentials) => {
		if ('token' in credentials) {
			return linkWith(credentials.provider);
		}

		const { provider, options } = credentials;
		const conflict = await mockGetIdentityLinked({ provider: loginProviderSchema.parse(provider) });
		const callbackQuery = conflict
			? 'error=server_error&error_code=identity_already_exists'
			: `code=link.${provider}`;

		return { data: { provider, url: `${options?.redirectTo ?? ''}?${callbackQuery}` }, error: null };
	},

	exchangeCodeForSession: async (code: string) => {
		const [flow, provider] = code.split('.');

		return flow === 'link' ? linkWith(provider) : signInWith(provider);
	},

	signOut: async () => {
		changeSession('SIGNED_OUT', null);

		return { error: null };
	},

	startAutoRefresh: async () => {},

	stopAutoRefresh: async () => {},
};

export function authClient(): AuthClient {
	return mockAuth as unknown as AuthClient;
}

export async function openAuthSession(url: string, _redirectTo: string): Promise<WebBrowserAuthSessionResult> {
	return { type: 'success', url };
}

export async function requestAppleCredential(
	_options: AppleAuthenticationSignInOptions,
): Promise<Pick<AppleAuthenticationCredential, 'identityToken' | 'authorizationCode'>> {
	return { identityToken: 'mock-apple-identity-token', authorizationCode: 'mock-apple-code' };
}
