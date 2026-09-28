import { StyleSheet, View } from 'react-native';

import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { useAccountForm } from '@/screens/profile/hooks/use-account-form';

import { PermissionDialog } from '@/components/dialogs/permission-dialog';
import { ProfilePhoto } from '@/components/profile-form/profile-photo';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { TextButton } from '@/components/ui/text-button';
import { TextField } from '@/components/ui/text-field';

interface Props {
	onSaved(): void;
}

export function AccountForm({ onSaved }: Props) {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const form = useAccountForm(meData, onSaved);

	return (
		<>
			{/*사진*/}
			<ProfilePhoto photo={form.photo} busy={form.busy} action={form.photo.photoUri ? 'edit' : 'plus'} />
			{form.photo.photoUri ? (
				<View style={styles.remove}>
					<TextButton
						label={t('profile.removePhoto')}
						tone="muted"
						disabled={form.busy}
						onPress={() => form.photo.setPhotoUri(null)}
					/>
				</View>
			) : null}

			{/*닉네임 입력*/}
			<TextField
				label={t('profile.nickname')}
				error={form.nicknameError}
				value={form.nickname}
				onChangeText={form.setNickname}
				editable={!form.busy}
				maxLength={20}
				placeholder={t('profile.nicknameHint')}
				autoCapitalize="none"
				returnKeyType="done"
				onSubmitEditing={form.save}
			/>

			{/*저장 버튼*/}
			<View style={styles.spacer} />
			<InlineError message={form.error} />
			<Button label={t('common.save')} loading={form.busy} onPress={form.save} style={styles.save} />

			{/*사진 권한 다이얼로그*/}
			<PermissionDialog state={form.photo.libraryDialog} />
			<PermissionDialog state={form.photo.cameraDialog} />
		</>
	);
}

const styles = StyleSheet.create({
	remove: { alignItems: 'flex-end', marginTop: -12, marginBottom: 8 },
	spacer: { flexGrow: 1, minHeight: 24 },
	save: { marginTop: 12 },
});
