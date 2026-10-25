import { StyleSheet, View } from 'react-native';

import type { ProfileStackParamList } from '@/types/navigation';

import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRightIcon, UserIcon } from 'lucide-react-native';

import { UPLOAD_POLL_INTERVAL_MS } from '@/config/policy';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

/** 계정 정보 표시 카드 컴포넌트 */
const ProfileCard = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
	const screenFocused = useIsFocused();

	const { data: meData } = useGetMe({
		refetchInterval: (query) =>
			screenFocused && query.state.data?.uploading_photo_file?.status === 'pending'
				? UPLOAD_POLL_INTERVAL_MS
				: false,
	});

	const titleText = meData.nickname ?? t('profile.nicknameMissing');

	return (
		<PressableSurface
			accessibilityLabel={joinLabel(
				t('profile.editAccount'),
				titleText,
				meData.email,
				meData.uploading_photo_file?.status === 'pending' && t('profile.photoUploading'),
				meData.uploading_photo_file?.status === 'rejected' && t('profile.photoUploadFailed'),
			)}
			depth="medium"
			onPress={() => navigation.navigate('AccountEditor')}
			contentStyle={styles.card}
		>
			<View style={styles.contentRow}>
				<Avatar
					uri={meData.photo_file?.url}
					placeholder=<UserIcon size={34} color={colors.subtle} />
					size="large"
					uploading={meData.uploading_photo_file?.status === 'pending'}
				/>

				<View style={styles.textContainer}>
					<Copy accessibilityRole="header" style={[styles.title, !meData.nickname && styles.accent]}>
						{titleText}
					</Copy>
					{!!meData.email && (
						<Copy style={styles.email} numberOfLines={1}>
							{meData.email}
						</Copy>
					)}
				</View>

				<ChevronRightIcon size={18} color={colors.subtle} />
			</View>
			<InlineError
				message={meData.uploading_photo_file?.status === 'rejected' ? t('profile.photoUploadFailed') : null}
			/>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	card: { padding: 20 },
	contentRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	accent: { color: colors.orangeDark, fontSize: 18, lineHeight: 24 },
	email: { fontSize: 14, color: colors.muted },
});

export default ProfileCard;
