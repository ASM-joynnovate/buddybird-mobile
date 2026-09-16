export type UploadConsent = {
	status: "unknown" | "granted" | "denied"
	decidedAt: string | null
	noticeVersion: number
}

export type AnalyticsConsent = "unknown" | "granted" | "denied" | "not_applicable"
