import type { ApiErrorCode } from "@/types/apis/common"

export type ApiErrorMessages = Record<Exclude<ApiErrorCode, "CLIENT__UNKNOWN_ERROR">, string>
