import type { ReportPeriod } from '@/types/report-period';
import type { SleepSettings } from '@/types/sleep-settings';

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MeasuredDimensions } from 'react-native-reanimated';

export interface LearningDuration {
	ms: number | null;
	custom: boolean;
}

export interface SessionSetup {
	wordId: string;
	duration: LearningDuration;
	sleep: SleepSettings | null;
	sleepChanged: boolean;
}

export type HomeStackParamList = {
	Home: undefined;
	Notifications: undefined;
};

export type WordsStackParamList = {
	WordList: undefined;
	WordEditor: { wordId?: string } | undefined;
};

export type ReportStackParamList = {
	Report: { period?: ReportPeriod; date?: string; source?: 'notification' } | undefined;
	SessionDetail: { sessionId: string; source: 'report' | 'summary' };
};

export type ProfileStackParamList = {
	Profile: undefined;
	AccountEditor: undefined;
};

export type MainTabParamList = {
	HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
	WordsTab: NavigatorScreenParams<WordsStackParamList> | undefined;
	ReportTab: NavigatorScreenParams<ReportStackParamList> | undefined;
	ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
	Login: { source?: 'onboarding' } | undefined;
	Consent: undefined;
	ConsentDetail: { consentId: string; source: 'onboarding' | 'settings' };
	ParrotEditor:
		| { parrotId?: string; source?: 'onboarding'; photoOrigin?: MeasuredDimensions; photoTilt?: number }
		| undefined;
	UsageGuide: undefined;
	PermissionRequest: undefined;
	Main: NavigatorScreenParams<MainTabParamList> | undefined;
	NoticeDetail: { noticeId: string };
	SessionRun: {
		sessionId: string;
		wordId: string;
		endsAt: number | null;
		sleep: SleepSettings | null;
		duration: LearningDuration;
		sleepChanged: boolean;
	};
	SessionSummary: { sessionId: string };
	RecordingGuide: undefined;
	Settings: undefined;
	NoticeList: undefined;
	ConsentSettings: undefined;
	Devices: undefined;
	NotificationSettings: undefined;
};
