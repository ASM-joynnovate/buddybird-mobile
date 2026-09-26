import { DAY, MINUTE, SECOND } from "@/utils/units"

export const API_TIMEOUT_MS = 30 * SECOND

export const SCREEN_REFRESH_MS = 10 * SECOND
export const DEFAULT_STALE_TIME_MS = 30 * SECOND
export const QUERY_CACHE_MAX_AGE_MS = 7 * DAY

export const HEARTBEAT_INTERVAL_MS = 10 * SECOND
export const STATION_SCREEN_IDLE_MS = 5 * SECOND
export const STATION_DISCONNECT_MS = MINUTE

export const UPLOAD_POLL_INTERVAL_MS = SECOND
export const RECORDING_MAX_SECONDS = 60

export const FEEDBACK_PROMPT_THRESHOLDS = [3, 5, 7, 10] as const

export const CYCLE = [
	{ phase: "learning", ms: 10 * MINUTE },
	{ phase: "rest", ms: 5 * MINUTE },
	{ phase: "stress_care", ms: 5 * MINUTE },
] as const
