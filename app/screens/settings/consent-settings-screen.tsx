import { useQuery } from '@tanstack/react-query';

import type { Consent } from '@/types/apis/consents';

import type { RootStackParamList } from '@/types/navigation';

import { getConsentListOptions, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { latestConsents } from '@/utils/latest-consents';

import { ConsentItem } from '@/components/consent-item';
import { GroupedList } from '@/components/ui/grouped-list';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function ConsentSettingsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: consentListData, isError, refetch } = useQuery(getConsentListOptions());

	const { isError: saveFailed, isPending, mutate } = useSaveConsent();

	function toggle(consent: Consent) {
		if (isPending) {
			return;
		}

		mutate({
			data: {
				consent_id: consent.id,
				status: consent.status === 'granted' ? 'denied' : 'granted',
			},
		});
	}

	function body() {
		if (isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
		}

		if (!consentListData) {
			return <Skeleton rows={4} height={56} />;
		}

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
								toggle: () => toggle(consent),
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
				<InlineError message={saveFailed ? t('settings.consents.saveError') : null} />
			</>
		);
	}

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader title={t('settings.consents.title')} onBack={() => navigation.goBack()} />

			{/*동의 항목*/}
			{body()}
		</Screen>
	);
}
