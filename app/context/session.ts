import { createContext } from "react"

import type { Timing } from "@/types/session"

import type { SessionFailure, SessionSnapshot } from "@modules/session-audio-engine/types"

export type SessionValue = {
	snapshot: SessionSnapshot
	error: SessionFailure | null
	start(wordId: string, settings: Timing): Promise<void>
	pause(): Promise<void>
	resume(): Promise<void>
	stop(): Promise<void>
	retry(): Promise<void>
	retryRecovery(): Promise<void>
}

export const SessionContext = createContext<SessionValue | null>(null)
