import { useCallback } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useGetParrotList } from '@/hooks/apis/parrots';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParrotEditorForm } from '@/screens/onboarding/components/parrot-editor-form';
import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

export function ParrotEditorScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const params = useRoute<RouteProp<RootStackParamList, 'ParrotEditor'>>().params;

	const { data: parrotListData } = useGetParrotList();

	const parrotId = params?.parrotId;
	const fromOnboarding = params?.source === 'onboarding';
	const canGoBack = navigation.canGoBack();
	const parrot = parrotId ? parrotListData.find((item) => item.id === parrotId) : undefined;

	useFocusEffect(
		useCallback(() => {
			if (fromOnboarding) {
				viewOnboardingStep('parrot');
			}
		}, [fromOnboarding]),
	);

	function done() {
		if (fromOnboarding) {
			completeOnboardingStep('parrot');

			if (parrotId) {
				navigation.navigate('UsageGuide');
			}

			return;
		}

		if (navigation.canGoBack()) {
			navigation.goBack();
		}
	}

	if (parrotId && !parrot) {
		return (
			<Screen>
				{/*헤더*/}
				<ScreenHeader onBack={canGoBack ? () => navigation.goBack() : undefined} />
			</Screen>
		);
	}

	return (
		<ParrotEditorForm
			key={parrot?.id ?? 'new'}
			parrot={parrot}
			canDelete={parrotListData.length > 1}
			intro={fromOnboarding || !parrot}
			onBack={canGoBack ? () => navigation.goBack() : undefined}
			onDone={done}
		/>
	);
}
