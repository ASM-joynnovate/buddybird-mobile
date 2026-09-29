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
import type { AppleAuthenticationSignInOptions } from 'expo-apple-authentication';

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

/** mock 세션 응답을 Supabase 세션 형식으로 변환하는 함수 */
const toSession = (mock: MockSession): Session => {
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
};

/** 현재 세션을 반환하는 함수 */
const getActiveSession = () => {
	if (activeSession === undefined) {
		const { authUserId, isAnonymous } = useAccountStore.getState();

		activeSession = authUserId ? toSession(mockGetSession({ authUserId, isAnonymous })) : null;
	}

	return activeSession;
};

/** 세션을 변경하고 onAuthStateChange 콜백에 알리는 함수 */
const changeSession = (event: AuthChangeEvent, session: Session | null) => {
	activeSession = session;

	mockPutSessionUser({ authUserId: session?.user.id ?? null });

	for (const listener of listeners) {
		listener(event, session);
	}
};

/** mock 서버 로그인 함수 */
const signInWith = async (provider: string) => {
	const session = toSession(await mockPostSignIn({ provider: loginProviderSchema.parse(provider) }));

	changeSession('SIGNED_IN', session);

	return { data: { user: session.user, session }, error: null };
};

/** 현재 계정에 로그인 방식을 연결하는 함수 */
const linkWith = async (provider: string) => {
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
};

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

/** Supabase 인증 클라이언트 대신 사용하는 mock 인증 클라이언트 */
export const authClient = () => {
	return mockAuth as unknown as AuthClient;
};

/** 로그인 브라우저 대신 사용하는 mock 함수 */
export const openAuthSession = async (url: string, _redirectTo: string) => {
	return { type: 'success', url };
};

/** Apple 로그인 대신 사용하는 mock 함수 */
export const requestAppleCredential = async (_options: AppleAuthenticationSignInOptions) => {
	return { identityToken: 'mock-apple-identity-token', authorizationCode: 'mock-apple-code' };
};
