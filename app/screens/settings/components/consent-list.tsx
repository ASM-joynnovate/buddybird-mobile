import type { Consent } from '@/types/apis/consents';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { latestConsents } from '@/utils/latest-consents';

import ConsentItem from '@/components/consent-item';
import { ItemGroup } from '@/components/ui/item/group';
import { Toast } from '@/components/ui/toast';

/** 약관 동의 목록 컴포넌트 */
const ConsentList = () => {
	const { t } = useTranslation();

	const { data: consentListData } = useGetConsentList();

	const { isPending, mutate } = useSaveConsent();

	const handleToggleConsent = (consent: Consent) => {
		if (isPending) {
			return;
		}

		mutate(
			{
				data: {
					consent_id: consent.id,
					status: consent.status === 'granted' ? 'denied' : 'granted',
				},
			},
			{
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.consents.saveError')} />);
				},
			},
		);
	};

	return (
		<ItemGroup>
			{latestConsents(consentListData).map((consent, index) => (
				<ConsentItem
					key={consent.id}
					isFirstInGroup={index === 0}
					consent={consent}
					checked={consent.is_required || consent.status === 'granted'}
					disabled={consent.is_required || isPending}
					source="settings"
					onToggle={() => handleToggleConsent(consent)}
				/>
			))}
		</ItemGroup>
	);
};

export default ConsentList;
