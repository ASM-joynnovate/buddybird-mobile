import { type Account, accountSchema, type LoginProvider } from '@/types/account';

import { mmkvStorage, persistKeys, restoreOptions, storageIds } from '@/lib/storage';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AccountActions = {
	setRegistration: (authUserId: string, serverUserId: string, isAnonymous: boolean) => void;
	clearRegistration: () => void;
	setLoginScreenSeen: (loginScreenSeen: boolean) => void;
	setLoginProvider: (loginProvider: LoginProvider) => void;
	setClientDeviceId: (clientDeviceId: string) => void;
};

type AccountStore = Account & AccountActions;

const initialAccount: Account = {
	authUserId: null,
	serverUserId: null,
	isAnonymous: true,
	loginScreenSeen: false,
	loginProvider: null,
	lastLoginProvider: null,
	clientDeviceId: null,
};

export const useAccountStore = create<AccountStore>()(
	persist(
		(set) => ({
			...initialAccount,

			/** 로그인한 사용자 정보 저장 */
			setRegistration: (authUserId, serverUserId, isAnonymous) => {
				set((state) => ({
					...state,
					authUserId,
					serverUserId,
					isAnonymous,
					lastLoginProvider: isAnonymous
						? state.lastLoginProvider
						: (state.loginProvider ?? state.lastLoginProvider),
				}));
			},

			/** 로그인한 사용자 정보 초기화 */
			clearRegistration: () => {
				set((state) => ({
					...state,
					authUserId: null,
					serverUserId: null,
					isAnonymous: true,
					loginScreenSeen: false,
				}));
			},

			/** 로그인 화면 확인 여부 저장 */
			setLoginScreenSeen: (loginScreenSeen) => {
				set((state) => ({ ...state, loginScreenSeen }));
			},

			/** 로그인 방식 저장 */
			setLoginProvider: (loginProvider) => {
				set((state) => ({ ...state, loginProvider }));
			},

			/** 이 기기 ID 저장 */
			setClientDeviceId: (clientDeviceId) => {
				set((state) => ({ ...state, clientDeviceId }));
			},
		}),
		{
			name: persistKeys.account.name,
			version: persistKeys.account.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),

			partialize: ({
				authUserId,
				serverUserId,
				isAnonymous,
				loginScreenSeen,
				loginProvider,
				lastLoginProvider,
				clientDeviceId,
			}) => ({
				authUserId,
				serverUserId,
				isAnonymous,
				loginScreenSeen,
				loginProvider,
				lastLoginProvider,
				clientDeviceId,
			}),

			...restoreOptions<AccountStore>({
				schema: accountSchema,
				storeName: persistKeys.account.name,
			}),
		},
	),
);
