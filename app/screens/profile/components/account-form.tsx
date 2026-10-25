import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useIsMutating } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';
import { useGetMe, useUpdateMe, useUploadUserPhoto } from '@/hooks/apis/users';
import useNicknameError from '@/hooks/use-nickname-error';
import usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { NICKNAME_MAX_LENGTH } from '@/config/policy';
import ProfilePhoto from '@/screens/profile/components/profile-photo';
import { reportError } from '@/services/telemetry/client';
import { isDuplicateNickname, normalizeNickname } from '@/utils/nickname';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';

interface Props {
	onSaved: () => void;
}

/**
 * 계정 정보 입력 컴포넌트
 * @param onSaved 저장 완료 시 실행할 함수
 */
const AccountForm = ({ onSaved }: Props) => {
	const { t } = useTranslation();

	const [nicknameInvalid, setNicknameInvalid] = useState(false);

	const { data: meData } = useGetMe();

	const [nickname, setNickname] = useState(meData.nickname ?? '');

	const updateMe = useUpdateMe();
	const uploadUserPhoto = useUploadUserPhoto();

	const userPhotoUploading = useIsMutating({ mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload') }) > 0;

	const savedPhotoUrl = meData.photo_file?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const nicknameError = useNicknameError(nicknameInvalid, updateMe.error);

	const saving = updateMe.isPending || userPhotoUploading;

	/** 저장 실패를 보고하고 토스트로 표시하는 함수 */
	const handleSaveError = (error: unknown) => {
		reportError(error, 'account_save');

		toast.custom(<Toast variant="error" message={t('common.saveErrorKept')} />);
	};

	/** 변경한 계정 사진 저장 함수 */
	const saveUserPhoto = () => {
		if (photo.photoChanged && photo.photoUri) {
			uploadUserPhoto.mutate({ uri: photo.photoUri }, { onSuccess: onSaved, onError: handleSaveError });
		} else {
			onSaved();
		}
	};

	const handleChangeNickname = (value: string) => {
		setNickname(value);
		setNicknameInvalid(false);

		updateMe.reset();
	};

	const handleSave = () => {
		if (saving) {
			return;
		}

		const normalizedNickname = normalizeNickname(nickname);

		if (!normalizedNickname) {
			setNicknameInvalid(true);

			return;
		}

		updateMe.mutate(
			{ data: { nickname: normalizedNickname } },
			{
				onSuccess: saveUserPhoto,
				onError: (error) => {
					if (!isDuplicateNickname(error)) {
						handleSaveError(error);
					}
				},
			},
		);
	};

	return (
		<>
			<View style={styles.spacer} />
			<ProfilePhoto photo={photo} busy={saving} action={photo.photoUri ? 'edit' : 'plus'} />

			<View style={styles.nicknameContainer}>
				<TextField
					label={t('profile.nickname')}
					errorMessage={nicknameError}
					value={nickname}
					onChangeText={handleChangeNickname}
					editable={!saving}
					maxLength={NICKNAME_MAX_LENGTH}
					placeholder={t('profile.nicknameHint')}
					autoCapitalize="none"
					returnKeyType="done"
					onSubmitEditing={handleSave}
				/>
			</View>

			<View style={styles.spacer} />
			<Button label={t('common.save')} loading={saving} onPress={handleSave} style={styles.save} />

			<PermissionDialog state={photo.libraryDialog} />
			<PermissionDialog state={photo.cameraDialog} />
		</>
	);
};

const styles = StyleSheet.create({
	nicknameContainer: { marginTop: 32 },
	spacer: { flexGrow: 1, minHeight: 24 },
	save: { marginTop: 12 },
});

export default AccountForm;
