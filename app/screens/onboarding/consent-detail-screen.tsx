import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useConsentStore } from '@/stores/consent';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 약관 제목과 내용을 보여 주고 동의 버튼을 누르면 동의를 반영한 뒤 이전 화면으로 돌아가는 화면 */
const ConsentDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { consentId, source } = useRoute<RouteProp<RootStackParamList, 'ConsentDetail'>>().params;

	const { data: consentListData } = useGetConsentList();

	const { isError: isSaveError, isPending, mutate } = useSaveConsent();

	const addAgreedId = useConsentStore((state) => state.addAgreedId);

	const consent = consentListData.find(({ id }) => id === consentId);
	const canAgree =
		consent !== undefined && (source === 'onboarding' || (!consent.is_required && consent.status !== 'granted'));

	/** 온보딩이면 동의 화면에 동의한 항목 전달, 설정이면 동의 저장 뒤 이전 화면으로 이동 */
	const handleAgree = () => {
		if (!consent) {
			return;
		}

		if (source === 'onboarding') {
			addAgreedId(consent.id);

			navigation.goBack();

			return;
		}

		mutate({ data: { consent_id: consent.id, status: 'granted' } }, { onSuccess: () => navigation.goBack() });
	};

	return (
		<Screen
			footer={
				canAgree ? (
					<>
						<InlineError message={isSaveError ? t('settings.consents.saveError') : null} />
						<Button label={t('common.consent.agree')} loading={isPending} onPress={handleAgree} />
					</>
				) : undefined
			}
		>
			{/*약관 제목과 뒤로 가기 버튼*/}
			<ScreenHeader title={consent?.title} onBack={() => navigation.goBack()} />

			{/*약관 내용*/}
			{consent && <Copy style={styles.text}>{consent.body}</Copy>}
		</Screen>
	);
};

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
});

export default ConsentDetailScreen;
