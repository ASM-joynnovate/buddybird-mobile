type WordEvent = { session_id: string; word_id: string; wordName: string }

type ProfileEvent = { parrot_name: string; parrot_species: string; parrot_age_months?: number }

type Lifetime = {
	word_id: string
	wordName: string
	lifetime_practice_count: number
	lifetime_practice_duration_ms: number
}

export type Events = {
	app_open: { cold_start: boolean }
	app_foreground: Record<string, never>
	app_background: { session_duration_ms: number }
	update_prompt_shown: { latest_version: string; is_forced: boolean }
	update_prompt_accepted: { latest_version: string; is_forced: boolean }
	update_prompt_dismissed: { latest_version: string }
	onboarding_started: Record<string, never>
	onboarding_step_completed: { step: "welcome" | "profile"; duration_ms: number }
	onboarding_completed: { total_duration_ms: number }
	onboarding_abandoned: { last_step: "welcome" | "profile"; last_step_duration_ms: number }
	profile_created: ProfileEvent
	profile_updated: Partial<ProfileEvent> & { fields_changed: string[] }
	profile_deleted: { parrot_name: string; lifetime_session_count: number }
	word_selected: WordEvent & { source: "list" | "recommendation" | "search" }
	word_recorded: WordEvent & {
		attempt_number: number
		recording_duration_ms: number
		audio_size_bytes: number
		recording_method: "voice" | "upload"
	}
	recording_played: WordEvent & { play_count: number; playback_duration_ms: number }
	word_added: {
		word_id: string
		wordName: string
		registration_method: "text" | "voice_recording"
		recording_duration_ms?: number
		audio_size_bytes?: number
	}
	word_recording_started: { wordName: string }
	word_recording_finished: {
		wordName: string
		recording_duration_ms: number
		retry_count: number
	}
	word_removed: Lifetime
	word_lifetime_metrics: Lifetime & {
		lifetime_recording_count: number
		last_practiced_at_days_ago: number
	}
	learning_started: { session_id: string; word_id: string; duration_ms?: number }
	learning_completed: {
		session_id: string
		learning_duration_ms: number
		total_duration_ms: number
	}
	learning_aborted: {
		session_id: string
		learning_duration_ms: number
		reason: "user" | "server" | "error"
	}
	tab_switched: { from: string; to: string }
	language_changed: { from: string; to: string }
	feedback_prompt_shown: { threshold: number }
	feedback_prompt_dismissed: { threshold: number }
	feedback_submitted: { source: "prompt" | "profile"; message_length: number }
	app_error: { error_code: string; screen_name: string | null }
	screen_view: { screen_name: string; screen_class: string }
}

export type TelemetryEvent = {
	[K in keyof Events]: { name: K; params: Events[K] }
}[keyof Events]

export type UserProperties = Partial<
	Record<
		| "parrot_name"
		| "parrot_species"
		| "parrot_age_months"
		| "total_words_registered"
		| "total_recording_duration_sec"
		| "locale",
		string | number | null
	>
>
