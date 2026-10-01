import { useInfiniteQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getNoticeListOptions } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpenIcon, MegaphoneIcon, SendIcon } from 'lucide-react-native';

import { useFeedbackStore } from '@/stores/feedback';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 지원 설정 컴포넌트 */
const SupportGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: noticeListData } = useInfiniteQuery({ ...getNoticeListOptions(), throwOnError: false });

	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	const hasUnreadNotice = Boolean(
		noticeListData?.pages.some((noticePage) => noticePage.data.some((notice) => !notice.is_read)),
	);

	return (
		<ItemGroup title={t('settings.support.title')}>
			<Item
				first
				icon={SendIcon}
				label={t('settings.support.feedback')}
				onPress={() => openFeedback('profile')}
			/>
			<Item
				icon={MegaphoneIcon}
				label={t('settings.support.notices')}
				showDot={hasUnreadNotice}
				onPress={() => navigation.navigate('NoticeList')}
			/>
			<Item
				icon={BookOpenIcon}
				label={t('settings.support.consents')}
				onPress={() => navigation.navigate('ConsentSettings')}
			/>
		</ItemGroup>
	);
};

export default SupportGroup;
