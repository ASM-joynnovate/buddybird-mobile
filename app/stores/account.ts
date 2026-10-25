import { type Account, accountSchema } from '@/types/account';

import { mmkvStorage, storeStorageKeys, restoreOptions, storageIds } from '@/lib/storage';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AccountActions = {
	setServerUserId: (serverUserId: string | null) => void;
};

type AccountStore = Account & AccountActions;

export const useAccountStore = create<AccountStore>()(
	persist(
		(set) => ({
			serverUserId: null,

			/** 서버 사용자 ID 저장 */
			setServerUserId: (serverUserId) => {
				set((state) => ({ ...state, serverUserId }));
			},
		}),
		{
			name: storeStorageKeys.account.name,
			version: storeStorageKeys.account.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),
			migrate: (persistedState) => persistedState,

			partialize: ({ serverUserId }) => ({ serverUserId }),

			...restoreOptions<AccountStore>({
				schema: accountSchema,
				storeName: storeStorageKeys.account.name,
			}),
		},
	),
);
