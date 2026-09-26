import type { NavigatorScreenParams } from "@react-navigation/native"

export type ReportPeriodParam = "day" | "week" | "month"

export type SessionDraft = {
	wordId: string | null
	learningEnabled: boolean
	replaceRunning: boolean
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
	Report: { period?: ReportPeriodParam; date?: string } | undefined
	SessionDetail: { sessionId: string; soundId?: string }
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
	SessionStart: { replaceRunning?: boolean } | undefined
	SessionRun: { sessionId: string }
	SessionSummary: { sessionId: string; role: "station" | "viewer" }
	RecordingGuide: { source: "add" | "help"; wordName: string }
	Recorder: { wordName: string }
	Settings: undefined
	NoticeList: undefined
	ConsentSettings: undefined
	Devices: undefined
	Permissions: undefined
}
