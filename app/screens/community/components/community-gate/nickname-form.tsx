import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useUpdateMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { NICKNAME_PATTERN } from '@/config';
import { reportError } from '@/services/telemetry/client';
import { useMessageStore } from '@/stores/message';
import { colors, font } from '@/theme';
import { isDuplicateNickname } from '@/utils/duplicate-nickname';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { TextField } from '@/components/ui/text-field';

/** 커뮤니티 입장 팝업의 닉네임 입력 컴포넌트 */
const CommunityGateNicknameForm = () => {
	const { t } = useTranslation();

	const [nickname, setNickname] = useState('');
	const [nicknameInvalid, setNicknameInvalid] = useState(false);

	const { error, isPending, mutateAsync, reset } = useUpdateMe();

	const openPopup = useMessageStore((state) => state.openPopup);

	let nicknameError: string | null = null;

	if (nicknameInvalid) {
		nicknameError = t('profile.nicknameInvalid');
	} else if (isDuplicateNickname(error)) {
		nicknameError = apiErrorMessage(error, t);
	}

	const handleChangeNickname = (value: string) => {
		setNickname(value);
		setNicknameInvalid(false);

		reset();
	};

	const handleSaveNickname = () => {
		if (isPending) {
			return;
		}

		const normalizedNickname = nickname.normalize('NFC').trim();

		if (!NICKNAME_PATTERN.test(normalizedNickname)) {
			setNicknameInvalid(true);

			return;
		}

		mutateAsync({ data: { nickname: normalizedNickname } }).catch((saveError: unknown) => {
			if (isDuplicateNickname(saveError)) {
				return;
			}

			reportError(saveError, 'community_nickname_save');

			openPopup({ title: apiErrorMessage(saveError, t) });
		});
	};

	return (
		<>
			<TextField
				accessibilityLabel={t('profile.nickname')}
				errorMessage={nicknameError}
				value={nickname}
				onChangeText={handleChangeNickname}
				editable={!isPending}
				maxLength={20}
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
