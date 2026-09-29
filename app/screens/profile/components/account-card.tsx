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
 * 내 사진, 닉네임, 이메일을 보여 주고 누르면 계정 편집 화면을 여는 카드 컴포넌트
 * @param user 보여 줄 사용자 정보
 */
const AccountCard = ({ user }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	const titleText = user.nickname ?? t('profile.nicknameMissing');

	return (
		<ProfileCard
			avatar={{ uri: user.photo?.url, icon: UserIcon, size: 'large' }}
			title={{ text: titleText, accent: !user.nickname }}
			details={[user.email]}
			label={joinLabel(t('profile.editAccount'), titleText, user.email)}
			onPress={() => navigation.navigate('AccountEditor')}
		/>
	);
};

export default AccountCard;
