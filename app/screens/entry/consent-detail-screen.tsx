import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useConsentStore } from '@/stores/consent';

import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Copy } from '@/components/ui/text';

export function ConsentDetailScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { consentId, source } = useRoute<RouteProp<RootStackParamList, 'ConsentDetail'>>().params;

	const { data: consentListData } = useGetConsentList();

	const { isError: isSaveError, isPending, mutate } = useSaveConsent();

	const consent = consentListData.find((item) => item.id === consentId);
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
			{consent && <Copy style={styles.text}>{consent.body}</Copy>}
		</Screen>
	);
}

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
});
