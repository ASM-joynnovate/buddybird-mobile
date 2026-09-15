import { createContext, useContext } from "react"

export type AuthState =
	| { status: "loading" | "completing" }
	| { status: "signedOut"; message?: string }
	| { status: "signedIn"; user_id: string; is_new_user: boolean }
	| { status: "error"; message: string }

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
