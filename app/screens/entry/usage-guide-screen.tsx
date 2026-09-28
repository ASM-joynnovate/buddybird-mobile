import { useCallback } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon, MicIcon, SmartphoneIcon, SunIcon } from 'lucide-react-native';

import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';

import { GuidePager, type GuideStep } from '@/components/guide-pager';

export function UsageGuideScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const steps: GuideStep[] = [
		{
			title: t('entry.usage.record.title'),
			scene: t('entry.usage.record.scene'),
			icon: MicIcon,
		},
		{
			title: t('entry.usage.place.title'),
			scene: t('entry.usage.place.scene'),
			icon: SmartphoneIcon,
		},
		{
			title: t('entry.usage.keepOn.title'),
			scene: t('entry.usage.keepOn.scene'),
			icon: SunIcon,
		},
		{
			title: t('entry.usage.report.title'),
			scene: t('entry.usage.report.scene'),
			icon: ChartNoAxesColumnIcon,
		},
	];

	useFocusEffect(
		useCallback(() => {
			viewOnboardingStep('usage_guide');
		}, []),
	);

	function next() {
		completeOnboardingStep('usage_guide');

		navigation.navigate('PermissionRequest');
	}

	return (
		<GuidePager
			steps={steps}
			actions={{
				finish: next,
				skip: next,
				back: navigation.canGoBack() ? () => navigation.goBack() : undefined,
			}}
			finishLabel={t('common.next')}
		/>
	);
}
