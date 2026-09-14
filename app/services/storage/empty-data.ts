import { AppData } from "@/types/app-data"
import { Locale } from "@/types/locale"

export function emptyData(locale: Locale): AppData {
	return {
		version: 1,
		profile: null,
		words: {},
		wordAliases: {},
		history: {},
		progress: {},
		captures: {},
		sessionDrafts: {},
		nativeCaptureReceipts: [],
		pendingWords: [],
		pendingFileDeletes: [],
		settings: {
			locale,
			analyticsConsent: "unknown",
			uploadConsent: { status: "unknown", decidedAt: null, noticeVersion: 1 },
			update: { dismissedVersion: null, lastCheckedAt: null },
			feedback: { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
			push: null,
			receipts: [],
			wordMetrics: {},
		},
	}
}
