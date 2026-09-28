import type { LoginProvider } from '@/types/account';
import type { ReportPeriod } from '@/types/report-period';

export type OnboardingStep = 'login' | 'consent' | 'legacy_upload' | 'parrot' | 'usage_guide' | 'permissions';

export type Events = {
	onboarding_step_viewed: { step: OnboardingStep };
	onboarding_step_completed: {
		step: OnboardingStep;
		duration_ms: number;
		login_method?: LoginProvider | 'skip';
		microphone_granted?: boolean;
		notifications_granted?: boolean;
	};
	onboarding_completed: { total_duration_ms: number };
	word_create_started: Record<string, never>;
	word_created: { word_id: string; recording_count: number };
	word_edit_started: { word_id: string };
	word_updated: {
		word_id: string;
		recording_count: number;
		added_count: number;
		removed_count: number;
		renamed: boolean;
	};
	recording_started: Record<string, never>;
	recording_finished: { duration_ms: number };
	word_deleted: { word_id: string; recording_count: number };
	learning_started: {
		session_id: string;
		word_id: string;
		recording_count: number;
		planned_duration_ms?: number;
		custom_duration: boolean;
		sleep_changed: boolean;
	};
	learning_paused: { session_id: string };
	learning_resumed: { session_id: string; paused_ms: number };
	learning_finished: {
		session_id: string;
		reason: 'time_reached' | 'user' | 'server' | 'error';
		learning_duration_ms: number;
		total_duration_ms: number;
		play_count: number;
		sound_count: number;
	};
	report_viewed: {
		period: ReportPeriod;
		periods_ago: number;
		source: 'tab' | 'notification';
		session_count: number;
	};
	session_detail_viewed: { session_id: string; source: 'report' | 'summary' };
	mimicry_played: { session_id: string };
	mimicry_shared: { session_id: string };
	notification_opened: {
		kind: 'mimicry' | 'daily_summary' | 'streak';
		from: 'push' | 'list';
	};
	language_changed: { from: string; to: string };
	update_prompt_shown: { latest_version: string; is_forced: boolean };
	update_prompt_accepted: { latest_version: string; is_forced: boolean };
	update_prompt_dismissed: { latest_version: string };
	feedback_prompt_shown: { threshold: number };
	feedback_prompt_dismissed: { threshold: number };
	feedback_submitted: { source: 'prompt' | 'profile'; message_length: number };
	app_error: { error_code: string; screen_name: string | null };
	screen_view: { screen_name: string; screen_class: string };
};

export type UserProperties = Partial<
	Record<
		'parrot_name' | 'parrot_species' | 'parrot_age_months' | 'total_words_registered' | 'locale',
		string | number | null
	>
>;
