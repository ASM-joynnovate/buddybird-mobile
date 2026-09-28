import type { Consent } from '@/types/apis/consents';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRightIcon } from 'lucide-react-native';

import { IconButton } from '@/components/ui/icon-button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';

interface Props {
	consent: Consent;
	checked: boolean;
	first?: boolean;
	disabled?: boolean;
	source: RootStackParamList['ConsentDetail']['source'];
	onToggle: () => void;
}

/**
 * 동의 항목 제목, 필수 또는 선택 표시, 체크박스를 보여 주고 누르면 동의를 바꾸며 화살표 버튼을 누르면 동의 전문 화면으로 이동하는 컴포넌트
 * @param consent 보여 줄 동의 항목
 * @param checked 동의 여부
 * @param first 목록의 첫 항목 여부
 * @param disabled 누를 수 없는지 여부
 * @param source 동의 전문 화면을 연 곳
 * @param onToggle 체크박스를 누를 때 실행할 함수
 */
const ConsentItem = ({ consent, checked, first, disabled, source, onToggle }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<ItemCheckbox
			first={first}
			label={consent.title}
			caption={t(consent.is_required ? 'common.consent.required' : 'common.consent.optional')}
			captionVariant={consent.is_required ? 'primary' : 'muted'}
			checked={checked}
			disabled={disabled}
			onToggle={onToggle}
			trailing=<IconButton
				icon={ChevronRightIcon}
				variant="muted"
				size="tiny"
				label={t('common.consent.viewFull', { title: consent.title })}
				onPress={() => navigation.navigate('ConsentDetail', { consentId: consent.id, source })}
			/>
		/>
	);
};

export default ConsentItem;
