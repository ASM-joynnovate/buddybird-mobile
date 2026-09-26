import { create } from "zustand"

export type AuthStatus = "loading" | "signingUp" | "completing" | "signedIn" | "error"

type AuthState = {
	status: AuthStatus
	attempt: number
}

type AuthActions = {
	setStatus: (status: AuthStatus) => void
	retry: () => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()((set) => ({
	status: "loading",
	attempt: 0,

	setStatus: (status) => {
		set((state) => ({ ...state, status }))
	},

	retry: () => {
		set((state) => ({ ...state, attempt: state.attempt + 1 }))
	},
}))
