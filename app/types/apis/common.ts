import { z } from "zod"

export const apiErrorCodes = [
	"COMMON__BAD_REQUEST",
	"COMMON__RESOURCE_NOT_FOUND",
	"COMMON__FILE_SIZE_EXCEEDED",
	"COMMON__IDEMPOTENCY_KEY_REQUIRED",
	"COMMON__REQUEST_VALIDATION_ERROR",
	"COMMON__RESPONSE_VALIDATION_ERROR",
	"COMMON__INTERNAL_SERVER_ERROR",
	"AUTH__INVALID_TOKEN",
	"AUTH__SERVICE_UNAVAILABLE",
	"AUTH__INVALID_PROVIDER_CREDENTIAL",
	"AUTH__PROVIDER_CREDENTIAL_REQUIRED",
	"AUTH__WITHDRAWAL_SAVE_UNAVAILABLE",
	"USER__SAVE_UNAVAILABLE",
	"USER__DUPLICATE_NICKNAME",
	"USER__INVALID_PROFILE_PHOTO",
	"USER__PHOTO_SERVICE_UNAVAILABLE",
	"DEVICE__NOT_REGISTERED",
	"DEVICE__NOT_STATION",
	"DEVICE__SAVE_UNAVAILABLE",
	"PARROT__SAVE_UNAVAILABLE",
	"WORD__SAVE_UNAVAILABLE",
	"WORD__RECORDING_LIMIT",
	"WORD__RECORDING_REQUIRED",
	"WORD__INVALID_RECORDING",
	"SESSION__SAVE_UNAVAILABLE",
	"SESSION__ALREADY_RUNNING",
	"SESSION__NOT_RUNNING",
	"SESSION__INVALID_SOUND",
	"FEEDBACK__SAVE_UNAVAILABLE",
	"NOTICE__SAVE_UNAVAILABLE",
	"NOTICE__IMAGE_SERVICE_UNAVAILABLE",
	"NOTICE__INVALID_PERIOD",
] as const

export const clientErrorCodes = [
	"CLIENT__NETWORK",
	"CLIENT__TIMEOUT",
	"CLIENT__INVALID_RESPONSE",
] as const

export type ApiErrorCode = (typeof apiErrorCodes)[number] | (typeof clientErrorCodes)[number]

export const envelopeSchema = z.object({
	message: z.string(),
	data: z.unknown(),
	meta: z.unknown(),
})

export const errorBodySchema = z.object({
	error_code: z.string(),
	message: z.string(),
})

export const pageMetaSchema = z.object({
	current_page: z.number().int(),
	total_page_count: z.number().int(),
	is_first: z.boolean(),
	is_last: z.boolean(),
})

export type PageMeta = z.infer<typeof pageMetaSchema>

export type Page<T> = { data: T[]; meta: PageMeta }
