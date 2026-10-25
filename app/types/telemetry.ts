import type { LoginProvider } from '@/types/auth';
import type { SessionDetailSource } from '@/types/navigation';
import type { ReportPeriod } from '@/types/report-period';

export type OnboardingStep =
	| 'login'
	| 'consent'
	| 'legacy_upload'
	| 'parrot'
	| 'usage_guide'
	| 'permissions'
	| 'marketing_notification';

export interface OnboardingStepViewedParams {
	step: OnboardingStep;
}

export interface OnboardingStepCompletedParams {
	step: OnboardingStep;
	duration_ms: number;
	login_method?: LoginProvider | 'skip';
	microphone_granted?: boolean;
	notifications_granted?: boolean;
	parrot_skipped?: boolean;
}

export interface OnboardingCompletedParams {
	total_duration_ms: number;
}

export interface WordRecordingCountParams {
	word_id: string;
	recording_count: number;
}

export interface WordEditStartedParams {
	word_id: string;
}

export interface WordUpdatedParams {
	word_id: string;
	recording_count: number;
	added_count: number;
	removed_count: number;
	renamed: boolean;
}

export interface RecordingFinishedParams {
	duration_ms: number;
}

export interface LearningStartedParams {
	session_id: string;
	word_id: string;
	recording_count: number;
	planned_duration_ms?: number;
	custom_duration: boolean;
	sleep_changed: boolean;
}

export interface SessionIdEventParams {
	session_id: string;
}

export interface LearningResumedParams {
	session_id: string;
	paused_ms: number;
}

export interface LearningFinishedParams {
	session_id: string;
	reason: 'time_reached' | 'user' | 'server' | 'error';
	learning_duration_ms: number;
	total_duration_ms: number;
	play_count: number;
	sound_count: number;
}

export interface ReportViewedParams {
	period: ReportPeriod;
	periods_ago: number;
	session_count: number;
}

export interface SessionDetailViewedParams {
	session_id: string;
	source: SessionDetailSource;
}

export interface NotificationOpenedParams {
	kind: string;
	from: 'push' | 'list';
}

export interface LanguageChangedParams {
	from: string;
	to: string;
}

export interface UpdatePromptParams {
	latest_version: string | null;
	is_forced: boolean;
}

export interface UpdatePromptDismissedParams {
	latest_version: string;
}

export interface FeedbackPromptParams {
	threshold: number;
}

export interface FeedbackSubmittedParams {
	source: 'prompt' | 'profile';
	message_length: number;
}

export interface AppErrorParams {
	error_code: string;
	screen_name: string | null;
}

export interface ScreenViewParams {
	screen_name: string;
	screen_class: string;
}

export interface AnalyticsEvents {
	onboarding_step_viewed: OnboardingStepViewedParams;
	onboarding_step_completed: OnboardingStepCompletedParams;
	onboarding_completed: OnboardingCompletedParams;
	word_create_started: Record<string, never>;
	word_created: WordRecordingCountParams;
	word_edit_started: WordEditStartedParams;
	word_updated: WordUpdatedParams;
	recording_started: Record<string, never>;
	recording_finished: RecordingFinishedParams;
	word_deleted: WordRecordingCountParams;
	learning_started: LearningStartedParams;
	learning_paused: SessionIdEventParams;
	learning_resumed: LearningResumedParams;
	learning_finished: LearningFinishedParams;
	report_viewed: ReportViewedParams;
	session_detail_viewed: SessionDetailViewedParams;
	parrot_sound_played: SessionIdEventParams;
	parrot_sound_shared: SessionIdEventParams;
	notification_opened: NotificationOpenedParams;
	language_changed: LanguageChangedParams;
	update_prompt_shown: UpdatePromptParams;
	update_prompt_accepted: UpdatePromptParams;
	update_prompt_dismissed: UpdatePromptDismissedParams;
	feedback_prompt_shown: FeedbackPromptParams;
	feedback_prompt_dismissed: FeedbackPromptParams;
	feedback_submitted: FeedbackSubmittedParams;
	app_foregrounded: Record<string, never>;
	app_backgrounded: Record<string, never>;
	app_error: AppErrorParams;
	screen_view: ScreenViewParams;
}

export type UserProperties = Partial<
	Record<'parrot_species' | 'parrot_age_months' | 'total_words_registered' | 'locale', string | number | null>
>;
