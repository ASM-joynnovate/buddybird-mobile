import type { NavigatorScreenParams } from "@react-navigation/native"

export type ReportPeriodParam = "day" | "week" | "month"

export type SessionSleep = { sleep_at: string; wake_at: string }

export type LearningDuration = { ms: number | null; custom: boolean }

export type SessionDraft = {
	wordId: string
	duration: LearningDuration
	sleep: SessionSleep
	sleepChanged: boolean
}

export type RecordedSample = { key: string; uri: string; durationMs: number }

export type HomeStackParamList = {
	Home: undefined
	Notifications: undefined
}

export type WordsStackParamList = {
	WordList: undefined
	WordEditor: { wordId?: string; recorded?: RecordedSample } | undefined
}

export type ReportStackParamList = {
	Report: { period?: ReportPeriodParam; date?: string; source?: "notification" } | undefined
	SessionDetail: { sessionId: string; source: "report" | "summary" }
}

export type ProfileStackParamList = {
	Profile: undefined
	AccountEditor: undefined
}

export type MainTabParamList = {
	HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined
	WordsTab: NavigatorScreenParams<WordsStackParamList> | undefined
	ReportTab: NavigatorScreenParams<ReportStackParamList> | undefined
	ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined
}

export type RootStackParamList = {
	Login: { source?: "entry" } | undefined
	Consent: undefined
	ConsentDetail: { consentId: string; source: "entry" | "settings" }
	ParrotEditor: { parrotId?: string; source?: "entry" } | undefined
	UsageGuide: undefined
	PermissionRequest: undefined
	Main: NavigatorScreenParams<MainTabParamList> | undefined
	NoticeDetail: { noticeId: string }
	SessionRun: {
		sessionId: string
		wordId: string
		endsAt: number | null
		sleep: SessionSleep
		duration: LearningDuration
		sleepChanged: boolean
	}
	SessionSummary: { sessionId: string }
	RecordingGuide: { source: "add" | "help"; wordName: string }
	Recorder: { wordName: string }
	Settings: undefined
	NoticeList: undefined
	ConsentSettings: undefined
	Devices: undefined
	Permissions: undefined
}
