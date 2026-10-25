import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { toast } from 'sonner-native';

import { useConsentStore } from '@/stores/consent';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Toast } from '@/components/ui/toast';

/** 약관 전문 화면 */
const ConsentDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { consentId, source } = useRoute<RouteProp<RootStackParamList, 'ConsentDetail'>>().params;

	const { data: consentListData } = useGetConsentList();

	const { isPending, mutate } = useSaveConsent();

	const addAgreedId = useConsentStore((state) => state.addAgreedId);

	const consent = consentListData.find(({ id }) => id === consentId);
	const canAgree =
		consent !== undefined && (source === 'onboarding' || (!consent.is_required && consent.status !== 'granted'));

	const handleAgree = () => {
		if (isPending || !consent) {
			return;
		}

		if (source === 'onboarding') {
			addAgreedId(consent.id);

			navigation.goBack();

			return;
		}

		mutate(
			{ data: { consent_id: consent.id, status: 'granted' } },
			{
				onSuccess: () => navigation.goBack(),
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.consents.saveError')} />);
				},
			},
		);
	};

	return (
		<Screen
			footer={canAgree && <Button label={t('common.consent.agree')} loading={isPending} onPress={handleAgree} />}
		>
			<ScreenHeader title={consent?.title} onBack={() => navigation.goBack()} />

			{consent && <Copy style={styles.text}>{consent.body}</Copy>}
		</Screen>
	);
};

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
});

export default ConsentDetailScreen;
