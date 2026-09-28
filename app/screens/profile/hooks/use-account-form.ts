import { useState } from 'react';

import type { User } from '@/types/apis/users';

import { useDeleteUserPhoto, useUpdateMe, useUploadUserPhoto } from '@/hooks/apis/users';
import { usePhotoPicker } from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { NICKNAME_PATTERN } from '@/config';
import { reportError } from '@/services/telemetry/client';
import { isDuplicateNickname } from '@/utils/duplicate-nickname';
import { saveWithPhoto } from '@/utils/save-with-photo';

export function useAccountForm(
	user: User,
	onSaved: () => void,
): {
	nickname: string;
	setNickname(value: string): void;
	nicknameError: string | null;
	photo: ReturnType<typeof usePhotoPicker>;
	busy: boolean;
	error: string | null;
	save(): void;
} {
	const { t } = useTranslation();

	const [nickname, setNickname] = useState(user.nickname ?? '');
	const [invalid, setInvalid] = useState(false);

	const updateMe = useUpdateMe();
	const uploadUserPhoto = useUploadUserPhoto();
	const deleteUserPhoto = useDeleteUserPhoto();

	const savedPhotoUrl = user.photo?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const busy = updateMe.isPending || uploadUserPhoto.isPending || deleteUserPhoto.isPending;
	const photoSaveFailed = uploadUserPhoto.isError || deleteUserPhoto.isError;
	const duplicate = isDuplicateNickname(updateMe.error);
	let nicknameError: string | null = null;

	if (invalid) {
		nicknameError = t('profile.nicknameInvalid');
	} else if (duplicate) {
		nicknameError = apiErrorMessage(updateMe.error, t);
	}

	function save() {
		const trimmed = nickname.trim();

		if (!NICKNAME_PATTERN.test(trimmed)) {
			setInvalid(true);

			return;
		}

		if (busy) {
			return;
		}

		saveWithPhoto({
			photoUri: photo.photoUri,
			savedPhotoUrl,
			saveInfo: () => updateMe.mutateAsync({ data: { nickname: trimmed } }),
			uploadPhoto: (_saved, uri) => uploadUserPhoto.mutateAsync({ uri }),
			deletePhoto: () => deleteUserPhoto.mutateAsync(),
			onDone: onSaved,
		}).catch((error: unknown) => {
			if (!isDuplicateNickname(error)) {
				reportError(error, 'account_save');
			}
		});
	}

	return {
		nickname,
		setNickname: (value) => {
			setNickname(value);
			setInvalid(false);

			updateMe.reset();
		},
		nicknameError,
		photo,
		busy,
		error: (updateMe.isError && !duplicate) || photoSaveFailed ? t('common.saveErrorKept') : null,
		save,
	};
}
