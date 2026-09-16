import type { PropsWithChildren } from "react"

import { SessionContext } from "@/context/session"
import { useSessionController } from "@/hooks/use-session-controller"

export function SessionProvider({ children }: PropsWithChildren) {
	const value = useSessionController()

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
