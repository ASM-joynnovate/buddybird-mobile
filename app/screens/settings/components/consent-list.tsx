import type { Consent } from '@/types/apis/consents';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { latestConsents } from '@/utils/latest-consents';

import ConsentItem from '@/components/consent-item';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';

/** 약관마다 동의 여부를 보여 주고 누르면 동의 여부를 바꿔 저장하는 컴포넌트 */
const ConsentList = () => {
	const { t } = useTranslation();

	const { data: consentListData } = useGetConsentList();

	const { isError, isPending, mutate } = useSaveConsent();

	/** 동의 여부 변경 */
	const handleToggleConsent = (consent: Consent) => {
		if (isPending) {
			return;
		}

		mutate({
			data: {
				consent_id: consent.id,
				status: consent.status === 'granted' ? 'denied' : 'granted',
			},
		});
	};

	return (
		<>
			{/*약관별 동의 여부*/}
			<ItemGroup>
				{latestConsents(consentListData).map((consent, index) => (
					<ConsentItem
						key={consent.id}
						first={index === 0}
						consent={consent}
						checked={consent.is_required || consent.status === 'granted'}
						disabled={consent.is_required || isPending}
						source="settings"
						onToggle={() => handleToggleConsent(consent)}
					/>
				))}
			</ItemGroup>

			{/*저장 실패 안내*/}
			<InlineError message={isError ? t('settings.consents.saveError') : null} />
		</>
	);
};

export default ConsentList;
