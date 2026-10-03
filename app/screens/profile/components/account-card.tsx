import type { User } from '@/types/apis/users';

import type { ProfileStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserIcon } from 'lucide-react-native';

import ProfileCard from '@/screens/profile/components/profile-card';
import { joinLabel } from '@/utils/a11y';

interface Props {
	user: User;
}

/**
 * 내 계정 카드 컴포넌트
 * @param user 표시할 사용자 정보
 */
const AccountCard = ({ user }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	const titleText = user.nickname ?? t('profile.nicknameMissing');

	return (
		<ProfileCard
			avatar={{
				uri: user.photo_file?.url,
				icon: UserIcon,
				size: 'large',
				uploading: user.uploading_photo_file?.status === 'pending',
				errorMessage: user.uploading_photo_file?.status === 'rejected' ? t('profile.photoUploadFailed') : null,
			}}
			title={{ text: titleText, accent: !user.nickname }}
			details={[user.email]}
			label={joinLabel(
				t('profile.editAccount'),
				titleText,
				user.email,
				user.uploading_photo_file?.status === 'pending' && t('profile.photoUploading'),
				user.uploading_photo_file?.status === 'rejected' && t('profile.photoUploadFailed'),
			)}
			onPress={() => navigation.navigate('AccountEditor')}
		/>
	);
};

export default AccountCard;
