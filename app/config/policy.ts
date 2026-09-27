import { DAY, HOUR, MINUTE, SECOND } from "@/utils/units"

export const API_TIMEOUT_MS = 30 * SECOND

export const SCREEN_REFRESH_MS = 10 * SECOND
export const DEFAULT_STALE_TIME_MS = 30 * SECOND

export const HEARTBEAT_INTERVAL_MS = 10 * SECOND
export const STATION_SCREEN_IDLE_MS = 10 * SECOND

export const DURATION_PRESETS = [40 * MINUTE, 80 * MINUTE, 4 * HOUR] as const
export const MAX_SESSION_MS = 7 * DAY

export const LEARNING_TICK_MS = SECOND
export const WORD_REST_FACTOR = 3

export const VAD = {
	sampleRate: 16000,
	frameMs: 100,
	dbFloor: -60,
	dbCeil: -10,
	threshold: 0.35,
	sustainMs: 300,
	releaseMs: 500,
	preRollMs: 500,
	echoTailGuardMs: 200,
	maxSegmentMs: 10000,
} as const

export const UPLOAD_POLL_INTERVAL_MS = SECOND
export const UPLOAD_POLL_MAX_INTERVAL_MS = 10 * SECOND
export const RECORDING_MAX_SECONDS = 60

export const FEEDBACK_PROMPT_THRESHOLDS = [3, 5, 7, 10] as const

export const MAX_DEVICE_MODEL_LENGTH = 100
export const MAX_DEVICE_OS_VERSION_LENGTH = 20

export const CYCLE = [
	{ phase: "learning", ms: 10 * MINUTE },
	{ phase: "rest", ms: 5 * MINUTE },
	{ phase: "stress_care", ms: 5 * MINUTE },
] as const
