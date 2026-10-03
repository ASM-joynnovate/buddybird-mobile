import { DAY, HOUR, MIB, MINUTE, SECOND } from '@/config/units';

export const API_TIMEOUT_MS = 30 * SECOND;

export const SCREEN_REFRESH_MS = 10 * SECOND;
export const DEFAULT_STALE_TIME_MS = 30 * SECOND;

export const HEARTBEAT_INTERVAL_MS = 10 * SECOND;
export const SESSION_INFO_HIDE_MS = 10 * SECOND;

export const SESSION_DURATION_PRESETS = [
	{ id: 'short', ms: 40 * MINUTE },
	{ id: 'medium', ms: 80 * MINUTE },
	{ id: 'long', ms: 4 * HOUR },
] as const;
export const CUSTOM_SESSION_DEFAULT_MS = 25 * MINUTE;
export const MAX_SESSION_MS = 7 * DAY;

export const LEARNING_TICK_MS = SECOND;
export const WORD_REPLAY_DELAY_FACTOR = 3;

export const VAD = {
	sampleRate: 16000,
	frameMs: 100,
	dbFloor: -60,
	dbCeil: -10,
	threshold: 0.35,
	minSoundMs: 300,
	minSilenceMs: 500,
	padBeforeMs: 500,
	ignoreAfterPlaybackMs: 200,
	maxSegmentMs: 10 * SECOND,
} as const;

export const UPLOAD_POLL_INTERVAL_MS = SECOND;
export const UPLOAD_POLL_MAX_INTERVAL_MS = 10 * SECOND;
export const RECORDING_MAX_SECONDS = 60;

export const MAX_UPLOAD_BYTES = 5 * MIB;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png'];

export const MAX_RECORDINGS = 5;
export const RECOMMENDED_RECORDINGS = 3;

export const NICKNAME_PATTERN = /^[\p{Script=Hangul}A-Za-z0-9_ ]{2,20}$/u;
export const PARROT_NAME_LIMIT = 20;
export const WORD_NAME_LIMIT = 50;
export const FEEDBACK_MESSAGE_LIMIT = 1000;

export const FEEDBACK_PROMPT_THRESHOLDS = [3, 5, 7, 10] as const;

export const MAX_DEVICE_MODEL_LENGTH = 100;
export const MAX_DEVICE_OS_VERSION_LENGTH = 20;

export const PHASE_CYCLE = [
	{ phase: 'learning', durationMs: 10 * MINUTE },
	{ phase: 'rest', durationMs: 5 * MINUTE },
	{ phase: 'stress_care', durationMs: 5 * MINUTE },
] as const;
