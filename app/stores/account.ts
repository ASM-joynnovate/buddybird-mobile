import { type Account, accountSchema, type LoginProvider } from '@/types/account';

import { mmkvStorage, restoreOptions } from '@/lib/storage';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistKeys, storageIds } from '@/stores/keys';

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

			clearRegistration: () => {
				set((state) => ({
					...state,
					authUserId: null,
					serverUserId: null,
					isAnonymous: true,
					loginScreenSeen: false,
				}));
			},

			setLoginScreenSeen: (loginScreenSeen) => {
				set((state) => ({ ...state, loginScreenSeen }));
			},

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
