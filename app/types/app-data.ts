import type { WordMetrics } from "@/types/analytics"
import type { Capture } from "@/types/capture"
import type { UploadConsent } from "@/types/consent"
import type { Profile } from "@/types/profile"
import type { Progress } from "@/types/progress"
import type { PushAuthorization, PushReceipt } from "@/types/push"
import type { History, SessionDraft, SessionSettings } from "@/types/session"
import type { Word } from "@/types/word"

export type LegacyImportProgress = {
	complete: boolean
	completed: string[]
	issues: { key: string; message: string }[]
}

export type AppData = {
	version: 2
	migration: LegacyImportProgress
	profile: Profile | null
	words: Record<string, Word>
	/** Old training IDs remain stable references to the current canonical word. */
	wordAliases: Record<string, string>
	history: Record<string, History>
	progress: Record<string, Progress>
	captures: Record<string, Capture>
	sessionDrafts: Record<string, SessionDraft>
	nativeCaptureReceipts: string[]
	pendingWords: string[]
	pendingFileDeletes: string[]
	settings: {
		uploadConsent: UploadConsent
		lastSession?: SessionSettings
		push: {
			token: string | null
			authorizationStatus: PushAuthorization
			updatedAt: string
		} | null
		receipts: PushReceipt[]
		wordMetrics: Record<string, WordMetrics>
	}
}
