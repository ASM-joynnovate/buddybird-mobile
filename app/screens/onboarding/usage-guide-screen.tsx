import { useCallback } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon, MicIcon, SmartphoneIcon, SunIcon } from 'lucide-react-native';

import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';

import GuidePager, { type GuideStep } from '@/components/guide-pager';

/** 사용 안내 화면 */
const UsageGuideScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const steps: GuideStep[] = [
		{
			title: t('onboarding.usage.record.title'),
			scene: t('onboarding.usage.record.scene'),
			icon: MicIcon,
		},
		{
			title: t('onboarding.usage.place.title'),
			scene: t('onboarding.usage.place.scene'),
			icon: SmartphoneIcon,
		},
		{
			title: t('onboarding.usage.keepOn.title'),
			scene: t('onboarding.usage.keepOn.scene'),
			icon: SunIcon,
		},
		{
			title: t('onboarding.usage.report.title'),
			scene: t('onboarding.usage.report.scene'),
			icon: ChartNoAxesColumnIcon,
		},
	];

	/** 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('usage_guide');
		}, []),
	);

	const handleNext = () => {
		trackOnboardingStepCompleted('usage_guide');

		navigation.navigate('PermissionRequest');
	};

	return (
		<GuidePager
			steps={steps}
			actions={{
				onFinish: handleNext,
				onSkip: handleNext,
				onBack: navigation.canGoBack() ? () => navigation.goBack() : undefined,
			}}
			finishLabel={t('common.next')}
		/>
	);
};

export default UsageGuideScreen;
