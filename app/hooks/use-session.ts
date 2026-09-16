import { useContext } from "react"

import { SessionContext } from "@/context/session"

export function useSession() {
	const value = useContext(SessionContext)

	if (!value) {
		throw new Error("SessionProvider missing")
	}

	return value
}
