import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Consent } from '@/types/apis/consents';

import type { RootStackParamList } from '@/types/navigation';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';
import useEntryRoute from '@/hooks/use-entry-route';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useConsentStore } from '@/stores/consent';
import { latestConsents } from '@/utils/latest-consents';

import BuddySays from '@/components/buddy-says';
import ConsentItem from '@/components/consent-item';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/surface/card';

/** 약관 동의 항목과 전체 동의 체크를 보여 주고 다음 버튼을 누르면 동의 여부를 저장한 뒤 다음 온보딩 단계로 넘어가는 화면 */
const ConsentScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [checkedById, setCheckedById] = useState<Record<string, boolean>>({});

	const { data: consentListData } = useGetConsentList();

	const { isError, isPending, mutateAsync } = useSaveConsent();

	const agreedIds = useConsentStore((state) => state.agreedIds);
	const clearAgreedIds = useConsentStore((state) => state.clearAgreedIds);

	const { entryRoute, parrotId } = useEntryRoute();

	const consents = latestConsents(consentListData);

	/** 동의 항목 체크 여부 */
	const isChecked = (consent: Consent) => checkedById[consent.id] ?? consent.status === 'granted';

	const allChecked = Boolean(consents.length) && consents.every(isChecked);
	const requiredChecked = consents.every((consent) => !consent.is_required || isChecked(consent));

	/** 화면에 들어올 때마다 onboarding_step_viewed 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('consent');
		}, []),
	);

	/** 동의 상세 화면에서 동의한 항목 체크 반영 */
	useFocusEffect(
		useCallback(() => {
			if (agreedIds.length === 0) {
				return;
			}

			setCheckedById((prev) => ({
				...prev,
				...Object.fromEntries(agreedIds.map((id) => [id, true])),
			}));

			clearAgreedIds();
		}, [agreedIds, clearAgreedIds]),
	);

	/** 동의 항목 체크 전환 */
	const handleToggleConsent = (consent: Consent) => {
		setCheckedById((prev) => ({ ...prev, [consent.id]: !isChecked(consent) }));
	};

	/** 전체 동의 체크 전환 */
	const handleToggleAll = () => {
		setCheckedById(Object.fromEntries(consents.map((consent) => [consent.id, !allChecked])));
	};

	/** 동의 항목 차례로 저장 뒤 동의 단계 완료 전송과 앵무새 편집 화면 이동 */
	const handleSave = async () => {
		if (isPending) {
			return;
		}

		try {
			for (const consent of consents) {
				await mutateAsync({
					data: {
						consent_id: consent.id,
						status: isChecked(consent) ? 'granted' : 'denied',
					},
				});
			}
		} catch {
			return;
		}

		trackOnboardingStepCompleted('consent');

		if (entryRoute !== 'Consent') {
			navigation.navigate('ParrotEditor', {
				parrotId: entryRoute === 'UsageGuide' ? parrotId : undefined,
				source: 'onboarding',
			});
		}
	};

	return (
		<Screen
			footer={
				<>
					<InlineError message={isError ? t('common.saveErrorKept') : null} />
					<Button
						label={t('common.next')}
						disabled={!requiredChecked}
						loading={isPending}
						onPress={() => void handleSave()}
					/>
				</>
			}
		>
			{/*안내 말풍선*/}
			<View style={styles.introContainer}>
				<BuddySays message={t('onboarding.consent.intro')} />
			</View>

			{/*동의 항목*/}
			<View style={styles.consentsContainer}>
				<Card contentStyle={styles.allCard}>
					<ItemCheckbox
						first
						label={t('onboarding.consent.all')}
						checked={allChecked}
						disabled={isPending}
						onToggle={handleToggleAll}
					/>
				</Card>

				<ItemGroup>
					{consents.map((consent, index) => (
						<ConsentItem
							key={consent.id}
							first={index === 0}
							consent={consent}
							checked={isChecked(consent)}
							disabled={isPending}
							source="onboarding"
							onToggle={() => handleToggleConsent(consent)}
						/>
					))}
				</ItemGroup>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	introContainer: { flexGrow: 1, paddingBottom: 28 },
	consentsContainer: { gap: 20 },
	allCard: { padding: 0 },
});

export default ConsentScreen;
