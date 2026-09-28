import { StyleSheet } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getConsentListOptions, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useConsentStore } from '@/stores/consent';

import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy } from '@/components/ui/text';

export function ConsentDetailScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { consentId, source } = useRoute<RouteProp<RootStackParamList, 'ConsentDetail'>>().params;

	const { data: consentListData, isError, refetch } = useQuery(getConsentListOptions());

	const { isError: isSaveError, isPending, mutate } = useSaveConsent();

	const consent = consentListData?.find((item) => item.id === consentId);
	const canAgree =
		consent !== undefined && (source === 'entry' || (!consent.is_required && consent.status !== 'granted'));

	function agree() {
		if (!consent) {
			return;
		}

		if (source === 'entry') {
			useConsentStore.getState().markAgreed(consent.id);

			navigation.goBack();

			return;
		}

		mutate({ data: { consent_id: consent.id, status: 'granted' } }, { onSuccess: () => navigation.goBack() });
	}

	function body() {
		if (isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
		}

		if (!consent) {
			return <Skeleton rows={6} height={20} />;
		}

		return <Copy style={styles.text}>{consent.body}</Copy>;
	}

	return (
		<Screen
			footer={
				canAgree ? (
					<>
						<InlineError message={isSaveError ? t('settings.consents.saveError') : null} />
						<Button label={t('entry.consentDetail.agree')} loading={isPending} onPress={agree} />
					</>
				) : undefined
			}
		>
			{/*헤더*/}
			<ScreenHeader title={consent?.title} onBack={() => navigation.goBack()} />

			{/*약관 본문*/}
			{body()}
		</Screen>
	);
}

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
});
