import { type Auth, authSchema, type LoginProvider } from '@/types/auth';

import { accountV2, mmkvStorage, storeStorageKeys, restoreOptions, storageIds } from '@/lib/storage';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthStatus = 'loading' | 'signedOut' | 'completing' | 'signedIn' | 'error';

type AuthState = Auth & {
	status: AuthStatus;
	retryCount: number;
};

type AuthActions = {
	setStatus: (status: AuthStatus) => void;
	retry: () => void;
	setRegistration: (authUserId: string, isAnonymous: boolean) => void;
	clearRegistration: () => void;
	setLoginScreenSeen: (loginScreenSeen: boolean) => void;
	setLoginProvider: (loginProvider: LoginProvider) => void;
};

type AuthStore = AuthState & AuthActions;

/** account v2 값을 대신 읽는 저장소 */
const authStorage = () => {
	const storage = mmkvStorage(storageIds.device);

	return {
		...storage,
		/** 저장값 조회 함수 */
		getItem: (name: string) => storage.getItem(name) ?? accountV2?.item ?? null,
	};
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			status: 'loading',
			retryCount: 0,
			authUserId: null,
			isAnonymous: true,
			loginScreenSeen: false,
			loginProvider: null,

			/** 인증 상태 저장 */
			setStatus: (status) => {
				set((state) => ({ ...state, status }));
			},

			/** 인증 다시 시도 횟수 1 증가 */
			retry: () => {
				set((state) => ({ ...state, retryCount: state.retryCount + 1 }));
			},

			/** 로그인한 사용자 정보 저장 */
			setRegistration: (authUserId, isAnonymous) => {
				set((state) => ({ ...state, authUserId, isAnonymous }));
			},

			/** 로그인한 사용자 정보 초기화 */
			clearRegistration: () => {
				set((state) => ({ ...state, authUserId: null, isAnonymous: true, loginScreenSeen: false }));
			},

			/** 로그인 화면 확인 여부 저장 */
			setLoginScreenSeen: (loginScreenSeen) => {
				set((state) => ({ ...state, loginScreenSeen }));
			},

			/** 로그인 방식 저장 */
			setLoginProvider: (loginProvider) => {
				set((state) => ({ ...state, loginProvider }));
			},
		}),
		{
			name: storeStorageKeys.auth.name,
			version: storeStorageKeys.auth.version,
			storage: createJSONStorage(authStorage),
			migrate: (persistedState) => persistedState,

			partialize: ({ authUserId, isAnonymous, loginScreenSeen, loginProvider }) => ({
				authUserId,
				isAnonymous,
				loginScreenSeen,
				loginProvider,
			}),

			...restoreOptions<AuthStore>({
				schema: authSchema,
				storeName: storeStorageKeys.auth.name,
			}),
		},
	),
);
