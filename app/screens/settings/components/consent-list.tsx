import type { Consent } from '@/types/apis/consents';

import type { RootStackParamList } from '@/types/navigation';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { latestConsents } from '@/utils/latest-consents';

import { ConsentItem } from '@/components/consent-item';
import { GroupedList } from '@/components/ui/grouped-list';
import { InlineError } from '@/components/ui/inline-error';

/** 동의 항목 목록 컴포넌트 */
const ConsentList = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
			{/*동의 항목 목록*/}
			<GroupedList>
				{latestConsents(consentListData).map((consent, index) => (
					<ConsentItem
						key={consent.id}
						first={index === 0}
						consent={consent}
						checked={consent.is_required || consent.status === 'granted'}
						disabled={consent.is_required || isPending}
						actions={{
							toggle: () => handleToggleConsent(consent),
							open: () =>
								navigation.navigate('ConsentDetail', {
									consentId: consent.id,
									source: 'settings',
								}),
						}}
					/>
				))}
			</GroupedList>

			{/*저장 실패 안내*/}
			<InlineError message={isError ? t('settings.consents.saveError') : null} />
		</>
	);
};

export default ConsentList;
