import { ApiError } from '@/types/apis/common';

import { NICKNAME_PATTERN } from '@/config/policy';

/** 닉네임 중복 오류인지 확인하는 함수 */
export const isDuplicateNickname = (error: unknown) => {
	return error instanceof ApiError && error.code === 'USER__DUPLICATE_NICKNAME';
};

/** 닉네임 정리 및 규칙 확인 함수 */
export const normalizeNickname = (nickname: string) => {
	const normalizedNickname = nickname.normalize('NFC').trim();

	return NICKNAME_PATTERN.test(normalizedNickname) ? normalizedNickname : null;
};
