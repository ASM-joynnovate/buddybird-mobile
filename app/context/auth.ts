import { createContext, useContext } from "react"

export type AuthState = { status: "loading" | "completing" | "signedOut" | "signedIn" | "error" }

export const AuthContext = createContext<{
	state: AuthState
	retry(): void
	signOut(): Promise<void>
} | null>(null)

export function useAuth() {
	const value = useContext(AuthContext)

	if (!value) {
		throw new Error("AuthProvider missing")
	}

	return value
}
