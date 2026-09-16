import { WordMetrics } from "@/types/analytics"
import { Capture } from "@/types/capture"
import { UploadConsent } from "@/types/consent"
import { Profile } from "@/types/profile"
import { Progress } from "@/types/progress"
import { PushAuthorization, PushReceipt } from "@/types/push"
import { History, SessionDraft, SessionSettings } from "@/types/session"
import { Word } from "@/types/word"

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
