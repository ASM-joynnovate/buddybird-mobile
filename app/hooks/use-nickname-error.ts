import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { isDuplicateNickname } from '@/utils/nickname';

/** 닉네임 입력 오류 문구 Hook */
const useNicknameError = (nicknameInvalid: boolean, saveError: unknown) => {
	const { t } = useTranslation();

	if (nicknameInvalid) {
		return t('profile.nicknameInvalid');
	}

	return isDuplicateNickname(saveError) ? apiErrorMessage(saveError, t) : null;
};

export default useNicknameError;
