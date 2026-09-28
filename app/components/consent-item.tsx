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

export function ConsentItem({ consent, checked, first, disabled, source, onToggle }: Props) {
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
}
