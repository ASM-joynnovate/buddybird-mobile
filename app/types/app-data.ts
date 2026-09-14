import { WordMetrics } from "@/types/analytics"
import { Capture } from "@/types/capture"
import { AnalyticsConsent, UploadConsent } from "@/types/consent"
import { Locale } from "@/types/locale"
import { Profile } from "@/types/profile"
import { Progress } from "@/types/progress"
import { PushAuthorization, PushReceipt } from "@/types/push"
import { History, SessionDraft, SessionSettings } from "@/types/session"
import { Word } from "@/types/word"

export type AppData = {
	version: 1
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
		locale: Locale
		analyticsConsent: AnalyticsConsent
		uploadConsent: UploadConsent
		lastSession?: SessionSettings
		update: { dismissedVersion: string | null; lastCheckedAt: number | null }
		feedback: {
			version: 1
			lastCountedDate: string | null
			dayCount: number
			thresholdIndex: number
		}
		push: {
			token: string | null
			authorizationStatus: PushAuthorization
			updatedAt: string
		} | null
		receipts: PushReceipt[]
		wordMetrics: Record<string, WordMetrics>
	}
}
