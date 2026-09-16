import {
	failureCodes,
	type FailureCode,
	type SessionFailure,
} from "@modules/session-audio-engine/types"

export function sessionFailure(
	cause: unknown,
	fallback: FailureCode = "audio-engine-failed",
): SessionFailure {
	const value = cause && typeof cause === "object" ? (cause as Record<string, unknown>) : {}
	const code = failureCodes.find((item) => item === value.code) ?? fallback

	return {
		code,
		message: typeof value.message === "string" ? value.message : "Session unavailable",
		recoverable: typeof value.recoverable === "boolean" ? value.recoverable : true,
	}
}
