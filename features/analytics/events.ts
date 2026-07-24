import type { AnalyticsParams } from './providers/types';

export type OnboardingStep = 'welcome' | 'profile';
export type RecordingMethod = 'voice' | 'upload';
export type RegistrationMethod = 'text' | 'voice_recording';
export type WordSelectSource = 'list' | 'recommendation' | 'search';
export type ParrotSpeciesValue = string;

export type AnalyticsEvent =
  | { name: 'app_open'; params: { cold_start: boolean } }
  | { name: 'app_foreground'; params: Record<string, never> }
  | { name: 'app_background'; params: { session_duration_ms: number } }
  | { name: 'update_prompt_shown'; params: { latest_version: string; is_forced: boolean } }
  | { name: 'update_prompt_accepted'; params: { latest_version: string; is_forced: boolean } }
  | { name: 'update_prompt_dismissed'; params: { latest_version: string } }
  | { name: 'onboarding_started'; params: Record<string, never> }
  | {
      name: 'onboarding_step_completed';
      params: { step: OnboardingStep; duration_ms: number };
    }
  | { name: 'onboarding_completed'; params: { total_duration_ms: number } }
  | {
      name: 'onboarding_abandoned';
      params: { last_step: OnboardingStep; last_step_duration_ms: number };
    }
  | {
      name: 'profile_created';
      params: {
        parrot_name: string;
        parrot_species: ParrotSpeciesValue;
        // 생년월일 모름이면 나이 미상 → 생략.
        parrot_age_months?: number;
      };
    }
  | {
      name: 'profile_updated';
      params: {
        fields_changed: readonly string[];
        parrot_name?: string;
        parrot_species?: ParrotSpeciesValue;
        parrot_age_months?: number;
      };
    }
  | {
      name: 'profile_deleted';
      params: { parrot_name: string; lifetime_session_count: number };
    }
  | {
      name: 'training_session_started';
      params: {
        session_id: string;
        word_count: number;
        target_word_ids: readonly string[];
        target_word_names: readonly string[];
        profile_age_days: number;
        parrot_species: ParrotSpeciesValue;
        parrot_name: string;
      };
    }
  | {
      name: 'word_selected';
      params: {
        session_id: string;
        word_id: string;
        word_name: string;
        source: WordSelectSource;
      };
    }
  | {
      name: 'word_practice_started';
      params: {
        session_id: string;
        word_id: string;
        word_name: string;
        attempt_number: number;
        cumulative_practice_count: number;
        cumulative_practice_duration_ms: number;
      };
    }
  | {
      name: 'word_recorded';
      params: {
        session_id: string;
        word_id: string;
        word_name: string;
        attempt_number: number;
        recording_duration_ms: number;
        audio_size_bytes: number;
        recording_method: RecordingMethod;
      };
    }
  | {
      name: 'recording_played';
      params: {
        session_id: string;
        word_id: string;
        word_name: string;
        play_count: number;
        playback_duration_ms: number;
      };
    }
  | {
      name: 'word_practice_completed';
      params: {
        session_id: string;
        word_id: string;
        word_name: string;
        practice_duration_ms: number;
        recordings_count: number;
        replay_count: number;
      };
    }
  | {
      name: 'training_session_completed';
      params: {
        session_id: string;
        total_duration_ms: number;
        words_practiced_count: number;
        words_recorded_count: number;
        words_skipped_count: number;
        total_recordings: number;
        avg_recording_duration_ms: number;
      };
    }
  | {
      name: 'training_session_abandoned';
      params: {
        session_id: string;
        duration_ms: number;
        progress_percent: number;
        last_word_id: string | null;
        last_word_name: string | null;
      };
    }
  | {
      name: 'training_session_backgrounded';
      params: {
        session_id: string;
        phase: 'learning' | 'rest';
        elapsed_seconds: number;
      };
    }
  | {
      name: 'training_session_recovered';
      params: {
        credited_learning_seconds: number;
      };
    }
  | { name: 'word_library_opened'; params: { total_words_count: number } }
  | {
      name: 'word_library_filter_changed';
      params: { from: string; to: string; visible_words_count: number };
    }
  | {
      name: 'word_library_preview_played';
      params: {
        word_id: string;
        word_name: string;
        source_type: 'preset' | 'recording';
        action: 'play' | 'stop';
      };
    }
  | {
      name: 'word_added';
      params: {
        word_id: string;
        word_name: string;
        category: string | null;
        registration_method: RegistrationMethod;
        recording_duration_ms?: number;
        audio_size_bytes?: number;
      };
    }
  | { name: 'word_recording_started'; params: { word_name: string } }
  | {
      name: 'word_recording_finished';
      params: { word_name: string; recording_duration_ms: number; retry_count: number };
    }
  | {
      name: 'word_removed';
      params: {
        word_id: string;
        word_name: string;
        lifetime_practice_count: number;
        lifetime_practice_duration_ms: number;
      };
    }
  | {
      name: 'word_lifetime_metrics';
      params: {
        word_id: string;
        word_name: string;
        lifetime_practice_count: number;
        lifetime_practice_duration_ms: number;
        lifetime_recording_count: number;
        last_practiced_at_days_ago: number;
      };
    }
  | { name: 'tab_switched'; params: { from: string; to: string } }
  | { name: 'language_changed'; params: { from: string; to: string } }
  | { name: 'feedback_prompt_shown'; params: { threshold: number } }
  | { name: 'feedback_prompt_dismissed'; params: { threshold: number } }
  | {
      name: 'feedback_submitted';
      params: { source: 'prompt' | 'profile'; message_length: number };
    }
  | { name: 'app_error'; params: { error_code: string; screen_name: string | null } };

export type AnalyticsEventName = AnalyticsEvent['name'];

export type UserPropertyKey =
  | 'profile_age_days'
  | 'parrot_name'
  | 'parrot_species'
  | 'parrot_age_months'
  | 'total_words_registered'
  | 'total_training_sessions'
  | 'total_recording_duration_sec'
  | 'locale';

const FIREBASE_EVENT_NAME_MAX = 40;
const FIREBASE_PARAM_NAME_MAX = 40;
const FIREBASE_PARAM_VALUE_MAX = 100;

export function toFirebaseParams(params: AnalyticsParams): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    const safeKey = key.slice(0, FIREBASE_PARAM_NAME_MAX);

    if (Array.isArray(value)) {
      sanitized[safeKey] = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => String(item))
        .join(',')
        .slice(0, FIREBASE_PARAM_VALUE_MAX);
      continue;
    }

    if (typeof value === 'string') {
      sanitized[safeKey] = value.slice(0, FIREBASE_PARAM_VALUE_MAX);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[safeKey] = value;
      continue;
    }
  }

  return sanitized;
}

export function clampEventName(name: string): string {
  return name.slice(0, FIREBASE_EVENT_NAME_MAX);
}
