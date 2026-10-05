import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useGetSettings, useUpdateNotificationSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { reportError } from '@/services/telemetry/client';
import { trackOnboardingCompleted, trackOnboardingStepCompleted } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Button } from '@/components/ui/button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ui } from '@/components/ui/styles';
import { Card } from '@/components/ui/surface/card';

/** 마케팅 알림 수신 여부를 저장하는 버튼 컴포넌트 */
const MarketingNotificationAnswer = () => {
	const { t } = useTranslation();

	const [nightAccepted, setNightAccepted] = useState(false);

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
			{
				data: {
					...settingsData.notifications,
					marketing_enabled: marketingEnabled,
					marketing_night_enabled: marketingEnabled && nightAccepted,
				},
			},
			{ onSettled: finishOnboarding },
		);
	};

	return (
		<View style={styles.container}>
			<Card contentStyle={styles.nightCard}>
				<ItemCheckbox
					first
					label={t('onboarding.marketing.night')}
					checked={nightAccepted}
					disabled={isPending}
					onToggle={() => setNightAccepted((prev) => !prev)}
				/>
			</Card>

			<View style={ui.actionsRow}>
				<Button
					label={t('onboarding.marketing.decline')}
					variant="secondary"
					size="small"
					disabled={isPending}
					style={ui.action}
					onPress={() => handleAnswer(false)}
				/>
				<Button
					label={t('onboarding.marketing.accept')}
					size="small"
					loading={isPending}
					style={ui.action}
					onPress={() => handleAnswer(true)}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 12 },
	nightCard: { padding: 0 },
});

export default MarketingNotificationAnswer;
