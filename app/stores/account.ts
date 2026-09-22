import { randomUUID } from "expo-crypto"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { mmkvStorage, recordRestoreError } from "@/lib/storage"
import { persistKeys, storageIds } from "@/stores/keys"
import { type Account, accountSchema, type LoginProvider } from "@/types/account"

type AccountActions = {
	markRegistered: (authUserId: string, serverUserId: string) => void
	clearRegistration: () => void
	markProvider: (provider: LoginProvider) => void
	ensureClientDeviceId: () => string
}

export type AccountStore = Account & AccountActions

const initialAccount: Account = {
	registeredUser: null,
	serverUserId: null,
	provider: null,
	lastLogin: null,
	clientDeviceId: null,
}

export const useAccountStore = create<AccountStore>()(
	persist(
		(set, get) => ({
			...initialAccount,

			markRegistered: (authUserId, serverUserId) => {
				set((state) => ({
					...state,
					registeredUser: authUserId,
					serverUserId,
					lastLogin: state.provider ?? state.lastLogin,
				}))
			},

			clearRegistration: () => {
				set((state) => ({ ...state, registeredUser: null, serverUserId: null }))
			},

			markProvider: (provider) => {
				set((state) => ({ ...state, provider }))
			},

			ensureClientDeviceId: () => {
				const saved = get().clientDeviceId

				if (saved) {
					return saved
				}

				const created = randomUUID()

				set((state) => ({ ...state, clientDeviceId: created }))

				return created
			},
		}),
		{
			name: persistKeys.account.name,
			version: persistKeys.account.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),

			partialize: ({
				registeredUser,
				serverUserId,
				provider,
				lastLogin,
				clientDeviceId,
			}) => ({
				registeredUser,
				serverUserId,
				provider,
				lastLogin,
				clientDeviceId,
			}),

			merge: (persisted, current) => {
				if (persisted === undefined) {
					return current
				}

				const parsed = accountSchema.safeParse(persisted)

				if (!parsed.success) {
					recordRestoreError(parsed.error, persistKeys.account.name)

					return current
				}

				return { ...current, ...parsed.data }
			},

			onRehydrateStorage: () => (_state, error) => {
				if (error) {
					recordRestoreError(error, persistKeys.account.name)
				}
			},
		},
	),
)
