import type { AppData } from "@/types/app-data"
import type { Capture } from "@/types/capture"
import type { Word } from "@/types/word"

export type UploadTrigger =
	| "cold_start"
	| "foreground"
	| "network"
	| "consent"
	| "session_end"
	| "accumulation"

export type UploadResponse = { status: number; body: unknown }

export type CaptureBatchResult = {
	response: UploadResponse | null
	includedIds: string[]
	omittedIds: string[]
}

export type CaptureOutcome = { capture: Capture; status: "success" | "rejected" }

export type UploadDependencies = {
	read: () => AppData
	update: (change: (data: AppData) => void) => AppData
	identity: () => string | null
	configured: () => boolean
	inspect: (uri: string) => Promise<{ exists: boolean; size: number }>
	sendWord: (word: Word, uid: string, signal?: AbortSignal) => Promise<UploadResponse>
	sendCaptures: (
		captures: Capture[],
		uid: string,
		signal?: AbortSignal,
	) => Promise<CaptureBatchResult>
	cleanup: () => Promise<void>
	resolved: (
		outcome: CaptureOutcome,
		batchSize: number,
		retrySingle: boolean,
		httpStatus?: number,
	) => void
	aborted: (
		reason: "server_error" | "network_error" | "unreadable_response" | "exception",
		successfulCaptureCount: number,
		status?: number,
	) => void
	rejectedWord: (word: Word, response: UploadResponse) => void
	error: (error: unknown) => void
}
