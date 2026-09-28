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

/** mock 세션 응답을 Supabase 세션 모양으로 변환 */
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

/** 지금 세션 반환, 처음 읽을 때는 계정 스토어의 사용자로 mock 세션 생성 */
const getActiveSession = () => {
	if (activeSession === undefined) {
		const { authUserId, isAnonymous } = useAccountStore.getState();

		activeSession = authUserId ? toSession(mockGetSession({ authUserId, isAnonymous })) : null;
	}

	return activeSession;
};

/** 세션을 바꾸고 mock 서버와 onAuthStateChange 콜백에 알림 */
const changeSession = (event: AuthChangeEvent, session: Session | null) => {
	activeSession = session;

	mockPutSessionUser({ authUserId: session?.user.id ?? null });

	for (const listener of listeners) {
		listener(event, session);
	}
};

/** 고른 로그인 방식으로 mock 서버에 로그인하고 받은 세션으로 변경 */
const signInWith = async (provider: string) => {
	const session = toSession(await mockPostSignIn({ provider: loginProviderSchema.parse(provider) }));

	changeSession('SIGNED_IN', session);

	return { data: { user: session.user, session }, error: null };
};

/** 지금 계정에 로그인 방식 연결, 다른 사용자에 이미 연결된 방식이면 identity_already_exists 오류 */
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

/** Supabase 인증 클라이언트 대신 사용하는 mock 인증 */
export const authClient = () => {
	return mockAuth as unknown as AuthClient;
};

/** 로그인 브라우저를 열지 않고 받은 주소를 성공 결과로 반환하는 mock */
export const openAuthSession = async (url: string, _redirectTo: string) => {
	return { type: 'success', url };
};

/** Apple 로그인 없이 고정된 mock ID 토큰과 인증 코드 반환 */
export const requestAppleCredential = async (_options: AppleAuthenticationSignInOptions) => {
	return { identityToken: 'mock-apple-identity-token', authorizationCode: 'mock-apple-code' };
};
