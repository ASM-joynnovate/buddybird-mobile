import { StyleSheet, View } from 'react-native';

import { useGetSettings, useUpdateNotificationSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { reportError } from '@/services/telemetry/client';
import { trackOnboardingCompleted, trackOnboardingStepCompleted } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Button } from '@/components/ui/button';
import { TextButton } from '@/components/ui/text-button';

/** 마케팅 알림 수신 여부를 저장하는 버튼 컴포넌트 */
const MarketingNotificationAnswer = () => {
	const { t } = useTranslation();

	const { data: settingsData } = useGetSettings();

	const { isPending, mutate } = useUpdateNotificationSettings();

	const setOnboardingCompleted = useDeviceSettingsStore((state) => state.setOnboardingCompleted);

	/** 온보딩 완료 함수 */
	const finishOnboarding = () => {
		trackOnboardingStepCompleted('marketing_notification');
		trackOnboardingCompleted();

		try {
			setOnboardingCompleted(true);
		} catch (e) {
			reportError(e, 'onboarding_completed_save');
		}
	};

	const handleAnswer = (marketingEnabled: boolean) => {
		if (isPending) {
			return;
		}

		mutate(
			{ data: { ...settingsData.notifications, marketing_enabled: marketingEnabled } },
			{ onSettled: finishOnboarding },
		);
	};

	return (
		<>
			<View style={styles.declineContainer}>
				<TextButton
					label={t('onboarding.marketing.decline')}
					variant="muted"
					disabled={isPending}
					onPress={() => handleAnswer(false)}
				/>
			</View>
			<Button label={t('onboarding.marketing.accept')} loading={isPending} onPress={() => handleAnswer(true)} />
		</>
	);
};

const styles = StyleSheet.create({
	declineContainer: { alignItems: 'flex-end' },
});

export default MarketingNotificationAnswer;
