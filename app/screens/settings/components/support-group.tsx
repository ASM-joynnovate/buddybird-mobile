import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpenIcon, SendIcon } from 'lucide-react-native';

import { useFeedbackStore } from '@/stores/feedback';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 지원 설정 컴포넌트 */
const SupportGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	return (
		<ItemGroup title={t('settings.support.title')}>
			<Item
				first
				icon={SendIcon}
				label={t('settings.support.feedback')}
				onPress={() => openFeedback('profile')}
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
