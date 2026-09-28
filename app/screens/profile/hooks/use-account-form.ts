import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import type { User } from '@/types/apis/users';

import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';
import { deletePhotoMutationOptions, updateMeMutationOptions, uploadPhotoMutationOptions } from '@/hooks/apis/users';
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

	const mutation = useMutation(updateMeMutationOptions());
	const photoUpload = useIdempotentMutation(uploadPhotoMutationOptions());
	const photoDelete = useMutation(deletePhotoMutationOptions());

	const savedPhotoUrl = user.photo?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const busy = mutation.isPending || photoUpload.isPending || photoDelete.isPending;
	const photoSaveFailed = photoUpload.isError || photoDelete.isError;
	const duplicate = isDuplicateNickname(mutation.error);
	let nicknameError: string | null = null;

	if (invalid) {
		nicknameError = t('profile.nicknameInvalid');
	} else if (duplicate) {
		nicknameError = apiErrorMessage(mutation.error, t);
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
			saveInfo: () => mutation.mutateAsync({ nickname: trimmed }),
			uploadPhoto: (_saved, uri) => photoUpload.mutateAsync({ uri }),
			deletePhoto: () => photoDelete.mutateAsync(),
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

			mutation.reset();
		},
		nicknameError,
		photo,
		busy,
		error: (mutation.isError && !duplicate) || photoSaveFailed ? t('common.saveErrorKept') : null,
		save,
	};
}
