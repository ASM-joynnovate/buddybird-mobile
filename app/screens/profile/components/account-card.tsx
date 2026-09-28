import type { User } from '@/types/apis/users';

import { useTranslation } from 'react-i18next';

import { UserIcon } from 'lucide-react-native';

import ProfileCard from '@/screens/profile/components/profile-card';
import { joinLabel } from '@/utils/a11y';

interface Props {
	user: User;
	onPress: () => void;
}

/**
 * 내 사진, 닉네임, 이메일을 보여 주는 카드 컴포넌트
 * @param user 보여 줄 사용자 정보
 * @param onPress 카드를 누를 때 실행할 함수
 */
const AccountCard = ({ user, onPress }: Props) => {
	const { t } = useTranslation();

	const titleText = user.nickname ?? t('profile.nicknameMissing');

	return (
		<ProfileCard
			avatar={{ uri: user.photo?.url, icon: UserIcon, size: 'large' }}
			title={{ text: titleText, accent: !user.nickname }}
			details={[user.email]}
			label={joinLabel(t('profile.editAccount'), titleText, user.email)}
			onPress={onPress}
		/>
	);
};

export default AccountCard;
