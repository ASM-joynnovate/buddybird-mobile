import { useQuery } from '@tanstack/react-query';

import type { Consent } from '@/types/apis/consents';

import type { RootStackParamList } from '@/types/navigation';

import { consentsQueryOptions, saveConsentMutationOptions } from '@/hooks/apis/consents';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

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

	const query = useQuery(consentsQueryOptions());

	const mutation = useIdempotentMutation(saveConsentMutationOptions());

	function toggle(consent: Consent) {
		if (mutation.isPending) {
			return;
		}

		mutation.mutate({
			data: {
				consent_id: consent.id,
				status: consent.status === 'granted' ? 'denied' : 'granted',
			},
		});
	}

	function body() {
		if (query.isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void query.refetch()} />;
		}

		if (!query.data) {
			return <Skeleton rows={4} height={56} />;
		}

		return (
			<>
				{/*동의 항목 목록*/}
				<GroupedList>
					{latestConsents(query.data).map((consent, index) => (
						<ConsentItem
							key={consent.id}
							first={index === 0}
							consent={consent}
							checked={consent.is_required || consent.status === 'granted'}
							disabled={consent.is_required || mutation.isPending}
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
				<InlineError message={mutation.isError ? t('settings.consents.saveError') : null} />
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
