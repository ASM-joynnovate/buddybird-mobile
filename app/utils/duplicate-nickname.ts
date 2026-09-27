import { ApiError } from "@/types/apis/common"

export function isDuplicateNickname(error: unknown): boolean {
	return error instanceof ApiError && error.code === "USER__DUPLICATE_NICKNAME"
}
