import type { AppData } from "@/types/app-data"

export function emptyData(): AppData {
	return {
		version: 2,
		migration: { complete: false, completed: [], issues: [] },
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
			uploadConsent: { status: "unknown", decidedAt: null, noticeVersion: 1 },
			push: null,
			receipts: [],
			wordMetrics: {},
		},
	}
}
