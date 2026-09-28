import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useDeleteUserPhoto, useGetMe, useUpdateMe, useUploadUserPhoto } from '@/hooks/apis/users';
import usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { NICKNAME_PATTERN } from '@/config';
import { reportError } from '@/services/telemetry/client';
import { isDuplicateNickname } from '@/utils/duplicate-nickname';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import ProfilePhoto from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { TextButton } from '@/components/ui/text-button';
import { TextField } from '@/components/ui/text-field';

interface Props {
	onSaved: () => void;
}

/**
 * 사진, 닉네임 입력, 저장 버튼을 보여 주고 저장을 누르면 닉네임과 바뀐 사진을 저장하는 컴포넌트
 * @param onSaved 저장을 마쳤을 때 실행할 함수
 */
const AccountForm = ({ onSaved }: Props) => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const [nickname, setNickname] = useState(meData.nickname ?? '');
	const [nicknameInvalid, setNicknameInvalid] = useState(false);

	const updateMe = useUpdateMe();
	const uploadUserPhoto = useUploadUserPhoto();
	const deleteUserPhoto = useDeleteUserPhoto();

	const savedPhotoUrl = meData.photo?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const saving = updateMe.isPending || uploadUserPhoto.isPending || deleteUserPhoto.isPending;
	const photoSaveFailed = uploadUserPhoto.isError || deleteUserPhoto.isError;
	const duplicateNickname = isDuplicateNickname(updateMe.error);
	let nicknameError: string | null = null;

	if (nicknameInvalid) {
		nicknameError = t('profile.nicknameInvalid');
	} else if (duplicateNickname) {
		nicknameError = apiErrorMessage(updateMe.error, t);
	}

	const saveError = (updateMe.isError && !duplicateNickname) || photoSaveFailed ? t('common.saveErrorKept') : null;

	/** 바뀐 사진의 업로드나 삭제 뒤 저장 완료 */
	const saveUserPhoto = () => {
		if (photo.photoUri && photo.photoUri !== savedPhotoUrl) {
			uploadUserPhoto.mutate(
				{ uri: photo.photoUri },
				{ onSuccess: onSaved, onError: (error) => reportError(error, 'account_save') },
			);
		} else if (!photo.photoUri && savedPhotoUrl) {
			deleteUserPhoto.mutate(undefined, {
				onSuccess: onSaved,
				onError: (error) => reportError(error, 'account_save'),
			});
		} else {
			onSaved();
		}
	};

	/** 닉네임 변경 */
	const handleChangeNickname = (value: string) => {
		setNickname(value);
		setNicknameInvalid(false);

		updateMe.reset();
	};

	/** 닉네임 검사 뒤 계정 정보 저장 */
	const handleSave = () => {
		if (saving) {
			return;
		}

		const trimmedNickname = nickname.trim();

		if (!NICKNAME_PATTERN.test(trimmedNickname)) {
			setNicknameInvalid(true);

			return;
		}

		updateMe.mutate(
			{ data: { nickname: trimmedNickname } },
			{
				onSuccess: saveUserPhoto,
				onError: (error) => {
					if (!isDuplicateNickname(error)) {
						reportError(error, 'account_save');
					}
				},
			},
		);
	};

	return (
		<>
			{/*사진*/}
			<ProfilePhoto photo={photo} busy={saving} action={photo.photoUri ? 'edit' : 'plus'} />
			{!!photo.photoUri && (
				<View style={styles.removePhotoContainer}>
					<TextButton
						label={t('profile.removePhoto')}
						variant="muted"
						disabled={saving}
						onPress={() => photo.setPhotoUri(null)}
					/>
				</View>
			)}

			{/*닉네임 입력*/}
			<TextField
				label={t('profile.nickname')}
				errorMessage={nicknameError}
				value={nickname}
				onChangeText={handleChangeNickname}
				editable={!saving}
				maxLength={20}
				placeholder={t('profile.nicknameHint')}
				autoCapitalize="none"
				returnKeyType="done"
				onSubmitEditing={handleSave}
			/>

			{/*저장 버튼*/}
			<View style={styles.spacer} />
			<InlineError message={saveError} />
			<Button label={t('common.save')} loading={saving} onPress={handleSave} style={styles.save} />

			{/*사진 권한 다이얼로그*/}
			<PermissionDialog state={photo.libraryDialog} />
			<PermissionDialog state={photo.cameraDialog} />
		</>
	);
};

const styles = StyleSheet.create({
	removePhotoContainer: { alignItems: 'flex-end', marginTop: -12, marginBottom: 8 },
	spacer: { flexGrow: 1, minHeight: 24 },
	save: { marginTop: 12 },
});

export default AccountForm;
