import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getParrotListOptions } from '@/hooks/apis/parrots';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParrotEditorForm } from '@/screens/entry/components/parrot-editor-form';
import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';

import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

export function ParrotEditorScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const params = useRoute<RouteProp<RootStackParamList, 'ParrotEditor'>>().params;

	const { data: parrotListData, isError, refetch } = useQuery(getParrotListOptions());

	const parrotId = params?.parrotId;
	const entry = params?.source === 'entry';
	const canGoBack = navigation.canGoBack();

	useFocusEffect(
		useCallback(() => {
			if (entry) {
				viewOnboardingStep('parrot');
			}
		}, [entry]),
	);

	function done() {
		if (entry) {
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

	if (parrotId && !parrotListData) {
		return (
			<Screen>
				{isError ? (
					<ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />
				) : (
					<Skeleton rows={4} />
				)}
			</Screen>
		);
	}

	const parrot = parrotId ? parrotListData?.find((item) => item.id === parrotId) : undefined;

	if (parrotId && !parrot) {
		return <Screen />;
	}

	return (
		<ParrotEditorForm
			key={parrot?.id ?? 'new'}
			parrot={parrot}
			canDelete={(parrotListData?.length ?? 0) > 1}
			intro={entry || !parrot}
			onBack={canGoBack ? () => navigation.goBack() : undefined}
			onDone={done}
		/>
	);
}
