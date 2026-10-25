import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useUpdateMe } from '@/hooks/apis/users';
import useNicknameError from '@/hooks/use-nickname-error';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { NICKNAME_MAX_LENGTH } from '@/config/policy';
import { reportError } from '@/services/telemetry/client';
import { colors, font } from '@/theme';
import { isDuplicateNickname, normalizeNickname } from '@/utils/nickname';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';

/** 커뮤니티 입장 팝업의 닉네임 입력 컴포넌트 */
const CommunityGateNicknameForm = () => {
	const { t } = useTranslation();

	const [nickname, setNickname] = useState('');
	const [nicknameInvalid, setNicknameInvalid] = useState(false);

	const { error: updateError, isPending, mutate, reset } = useUpdateMe();

	const nicknameError = useNicknameError(nicknameInvalid, updateError);

	const handleChangeNickname = (nextNickname: string) => {
		setNickname(nextNickname);
		setNicknameInvalid(false);

		reset();
	};

	const handleSaveNickname = () => {
		if (isPending) {
			return;
		}

		const normalizedNickname = normalizeNickname(nickname);

		if (!normalizedNickname) {
			setNicknameInvalid(true);

			return;
		}

		mutate(
			{ data: { nickname: normalizedNickname } },
			{
				onError: (error) => {
					if (isDuplicateNickname(error)) {
						return;
					}

					reportError(error, 'community_nickname_save');

					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
				},
			},
		);
	};

	return (
		<>
			<TextField
				accessibilityLabel={t('profile.nickname')}
				errorMessage={nicknameError}
				value={nickname}
				onChangeText={handleChangeNickname}
				editable={!isPending}
				maxLength={NICKNAME_MAX_LENGTH}
				placeholder={t('profile.nickname')}
				autoCapitalize="none"
				returnKeyType="done"
				onSubmitEditing={handleSaveNickname}
			/>
			{!nicknameError && <Copy style={styles.hint}>{t('profile.nicknameHint')}</Copy>}

			<Button
				label={t('community.gate.start')}
				size="small"
				depth="high"
				disabled={!nickname.trim()}
				loading={isPending}
				onPress={handleSaveNickname}
				style={styles.startButton}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	hint: {
		marginTop: -4,
		paddingLeft: 2,
		fontFamily: font.extraBold,
		fontSize: 12,
		lineHeight: 16,
		color: colors.subtle,
	},
	startButton: { marginTop: 6 },
});

export default CommunityGateNicknameForm;
