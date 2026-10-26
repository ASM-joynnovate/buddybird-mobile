import { useTranslation } from 'react-i18next';

import { SendIcon } from 'lucide-react-native';

import { useFeedbackStore } from '@/stores/feedback';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 지원 설정 컴포넌트 */
const SupportGroup = () => {
	const { t } = useTranslation();

	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	return (
		<ItemGroup title={t('settings.support.title')}>
			<Item
				isFirstInGroup
				icon={SendIcon}
				label={t('settings.support.feedback')}
				onPress={() => openFeedback('profile')}
			/>
		</ItemGroup>
	);
};

export default SupportGroup;
