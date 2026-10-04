import { ApiError } from '@/types/apis/common';

/** 닉네임 중복 오류인지 확인하는 함수 */
export const isDuplicateNickname = (error: unknown) => {
	return error instanceof ApiError && error.code === 'USER__DUPLICATE_NICKNAME';
};
