import { randomUUID } from "expo-crypto"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { mmkvStorage, recordRestoreError } from "@/lib/storage"
import { persistKeys, storageIds } from "@/stores/keys"
import { type Account, accountSchema, type LoginProvider } from "@/types/account"

type AccountActions = {
	markRegistered: (authUserId: string, serverUserId: string, isAnonymous: boolean) => void
	clearRegistration: () => void
	markLoginScreenSeen: () => void
	markProvider: (provider: LoginProvider) => void
	ensureClientDeviceId: () => string
}

type AccountStore = Account & AccountActions

const initialAccount: Account = {
	registeredUser: null,
	serverUserId: null,
	isAnonymous: true,
	loginScreenSeen: false,
	provider: null,
	lastLogin: null,
	clientDeviceId: null,
}

export const useAccountStore = create<AccountStore>()(
	persist(
		(set, get) => ({
			...initialAccount,

			markRegistered: (authUserId, serverUserId, isAnonymous) => {
				set((state) => ({
					...state,
					registeredUser: authUserId,
					serverUserId,
					isAnonymous,
					lastLogin: isAnonymous ? state.lastLogin : (state.provider ?? state.lastLogin),
				}))
			},

			clearRegistration: () => {
				set((state) => ({
					...state,
					registeredUser: null,
					serverUserId: null,
					isAnonymous: true,
					loginScreenSeen: false,
				}))
			},

			markLoginScreenSeen: () => {
				set((state) => ({ ...state, loginScreenSeen: true }))
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
				isAnonymous,
				loginScreenSeen,
				provider,
				lastLogin,
				clientDeviceId,
			}) => ({
				registeredUser,
				serverUserId,
				isAnonymous,
				loginScreenSeen,
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
