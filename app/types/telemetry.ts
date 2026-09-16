type WordEvent = { session_id: string; word_id: string; word_name: string }

type ProfileEvent = { parrot_name: string; parrot_species: string; parrot_age_months?: number }

type Lifetime = {
	word_id: string
	word_name: string
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
	training_session_started: {
		session_id: string
		word_count: number
		target_word_ids: string[]
		target_word_names: string[]
		profile_age_days: number
		parrot_species: string
		parrot_name: string
	}
	word_selected: WordEvent & { source: "list" | "recommendation" | "search" }
	word_practice_started: WordEvent & {
		attempt_number: number
		cumulative_practice_count: number
		cumulative_practice_duration_ms: number
	}
	word_recorded: WordEvent & {
		attempt_number: number
		recording_duration_ms: number
		audio_size_bytes: number
		recording_method: "voice" | "upload"
	}
	recording_played: WordEvent & { play_count: number; playback_duration_ms: number }
	word_practice_completed: WordEvent & {
		practice_duration_ms: number
		recordings_count: number
		replay_count: number
	}
	training_session_completed: {
		session_id: string
		total_duration_ms: number
		words_practiced_count: number
		words_recorded_count: number
		words_skipped_count: number
		total_recordings: number
		avg_recording_duration_ms: number
	}
	training_session_abandoned: {
		session_id: string
		duration_ms: number
		progress_percent: number
		last_word_id: string | null
		last_word_name: string | null
	}
	training_session_backgrounded: {
		session_id: string
		phase: "learning" | "rest" | "stress-care"
		elapsed_seconds: number
	}
	follow_along_capture_created: {
		client_capture_id: string
		session_id: string
		client_word_id: string
		cycle: number
		phase: "learning" | "rest"
		audio_size_bytes: number
		pending_count: number
	}
	capture_upload_succeeded: {
		client_capture_id: string
		latency_ms?: number
		batch_size: number
		is_retry_single: boolean
	}
	capture_upload_failed: {
		client_capture_id: string
		reason: "server_reject" | "network_error" | "server_error"
		age_ms?: number
		http_status?: number
	}
	capture_flush_aborted: {
		reason: "server_error" | "network_error" | "unreadable_response" | "exception"
		pending_count?: number
		succeeded_before_abort: number
		http_status?: number
	}
	capture_evicted_before_upload: {
		client_capture_id: string
		age_ms?: number
		audio_size_bytes: number
	}
	session_perf_degraded: {
		kind: "audio_delay" | "ui_lag"
		value_ms: number
		during_upload: boolean
		session_id: string
		consent_status: "unknown" | "granted" | "denied"
	}
	word_library_opened: { total_words_count: number }
	word_library_filter_changed: { from: string; to: string; visible_words_count: number }
	word_library_preview_played: {
		word_id: string
		word_name: string
		source_type: "preset" | "recording"
		action: "play" | "stop"
	}
	word_added: {
		word_id: string
		word_name: string
		category: string | null
		registration_method: "text" | "voice_recording"
		recording_duration_ms?: number
		audio_size_bytes?: number
	}
	word_recording_started: { word_name: string }
	word_recording_finished: {
		word_name: string
		recording_duration_ms: number
		retry_count: number
	}
	word_removed: Lifetime
	word_lifetime_metrics: Lifetime & {
		lifetime_recording_count: number
		last_practiced_at_days_ago: number
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
		| "profile_age_days"
		| "parrot_name"
		| "parrot_species"
		| "parrot_age_months"
		| "total_words_registered"
		| "total_training_sessions"
		| "total_recording_duration_sec"
		| "locale",
		string | number | null
	>
>
