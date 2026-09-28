import type { Consent } from '@/types/apis/consents';

import { useTranslation } from 'react-i18next';

import { ChevronRightIcon } from 'lucide-react-native';

import { GroupedListCheckItem } from '@/components/ui/grouped-list/check-item';
import { IconButton } from '@/components/ui/icon-button';

interface Props {
	consent: Consent;
	checked: boolean;
	first?: boolean;
	disabled?: boolean;
	actions: { toggle(): void; open(): void };
}

export function ConsentItem({ consent, checked, first, disabled, actions }: Props) {
	const { t } = useTranslation();

	return (
		<GroupedListCheckItem
			first={first}
			label={consent.title}
			caption={t(consent.is_required ? 'entry.consent.required' : 'entry.consent.optional')}
			captionTone={consent.is_required ? 'primary' : 'muted'}
			checked={checked}
			disabled={disabled}
			onToggle={actions.toggle}
			trailing=<IconButton
				icon={ChevronRightIcon}
				variant="muted"
				size="tiny"
				label={t('entry.consent.viewFull', { title: consent.title })}
				onPress={actions.open}
			/>
		/>
	);
}
