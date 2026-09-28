import { StyleSheet } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { consentsQueryOptions, saveConsentMutationOptions } from '@/hooks/apis/consents';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

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

	const query = useQuery(consentsQueryOptions());

	const mutation = useIdempotentMutation(saveConsentMutationOptions());

	const consent = query.data?.find((item) => item.id === consentId);
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

		mutation.mutate(
			{ decision: { consent_id: consent.id, status: 'granted' } },
			{ onSuccess: () => navigation.goBack() },
		);
	}

	function body() {
		if (query.isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void query.refetch()} />;
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
						<InlineError message={mutation.isError ? t('settings.consents.saveError') : null} />
						<Button label={t('entry.consentDetail.agree')} loading={mutation.isPending} onPress={agree} />
					</>
				) : undefined
			}
		>
			<ScreenHeader title={consent?.title} onBack={() => navigation.goBack()} />
			{body()}
		</Screen>
	);
}

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
});
