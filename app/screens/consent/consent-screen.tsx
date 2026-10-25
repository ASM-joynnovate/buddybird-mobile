import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Consent } from '@/types/apis/consents';

import { useGetConsentList, useSaveConsent } from '@/hooks/apis/consents';
import useStartupLanding from '@/hooks/use-startup-landing';

import { useTranslation } from 'react-i18next';

import { useFocusEffect } from '@react-navigation/native';
import { toast } from 'sonner-native';

import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useConsentStore } from '@/stores/consent';
import { latestConsents } from '@/utils/latest-consents';

import BuddySays from '@/components/buddy-says';
import ConsentItem from '@/components/consent-item';
import { Button } from '@/components/ui/button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/surface/card';
import { Toast } from '@/components/ui/toast';

/** 약관 동의 화면 */
const ConsentScreen = () => {
	const { t } = useTranslation();

	const [checkedById, setCheckedById] = useState<Record<string, boolean>>({});

	const { data: consentListData } = useGetConsentList();

	const { isPending, mutateAsync } = useSaveConsent();

	const agreedIds = useConsentStore((state) => state.agreedIds);

	const clearAgreedIds = useConsentStore((state) => state.clearAgreedIds);

	const { buddyRef, buddyStyle, bubbleStyle } = useStartupLanding();

	const consents = latestConsents(consentListData);

	/** 동의 항목 체크 여부 */
	const isChecked = (consent: Consent) => checkedById[consent.id] ?? consent.status === 'granted';

	const allChecked = Boolean(consents.length) && consents.every(isChecked);
	const requiredChecked = consents.every((consent) => !consent.is_required || isChecked(consent));

	/** onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('consent');
		}, []),
	);

	/** 약관 전문 화면에서 동의한 항목 체크 반영 */
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

	const handleToggleConsent = (consent: Consent) => {
		setCheckedById((prev) => ({ ...prev, [consent.id]: !isChecked(consent) }));
	};

	const handleToggleAll = () => {
		setCheckedById(Object.fromEntries(consents.map((consent) => [consent.id, !allChecked])));
	};

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
			toast.custom(<Toast variant="error" message={t('common.saveErrorKept')} />);

			return;
		}

		trackOnboardingStepCompleted('consent');
	};

	return (
		<Screen
			footer=<Button
				label={t('common.next')}
				disabled={!requiredChecked}
				loading={isPending}
				onPress={() => void handleSave()}
			/>
		>
			<View style={styles.introContainer}>
				<BuddySays
					message={t('onboarding.consent.intro')}
					mascotRef={buddyRef}
					mascotStyle={buddyStyle}
					bubbleStyle={bubbleStyle}
				/>
			</View>

			<View style={styles.consentsContainer}>
				<Card contentStyle={styles.allCard}>
					<ItemCheckbox
						firstInGroup
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
							firstInGroup={index === 0}
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
