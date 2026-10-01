import { useCallback } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useGetParrotList } from '@/hooks/apis/parrots';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type Animated from 'react-native-reanimated';
import { useAnimatedRef } from 'react-native-reanimated';

import ParrotEditorForm from '@/screens/onboarding/components/parrot-editor-form';
import ParrotPhotoFlight, { type ParrotPhotoFlightStyles } from '@/screens/onboarding/components/parrot-photo-flight';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 앵무새 편집 화면 */
const ParrotEditorScreen = () => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const params = useRoute<RouteProp<RootStackParamList, 'ParrotEditor'>>().params;

	const { data: parrotListData } = useGetParrotList();

	const photoRef = useAnimatedRef<Animated.View>();

	const parrotId = params?.parrotId;
	const fromOnboarding = params?.source === 'onboarding';
	const canGoBack = navigation.canGoBack();
	const parrot = parrotId ? parrotListData.find(({ id }) => id === parrotId) : undefined;

	/** 온보딩에서 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			if (fromOnboarding) {
				trackOnboardingStepViewed('parrot');
			}
		}, [fromOnboarding]),
	);

	const handleDone = () => {
		if (fromOnboarding) {
			trackOnboardingStepCompleted('parrot');

			if (parrotId) {
				navigation.navigate('UsageGuide');
			}

			return;
		}

		if (navigation.canGoBack()) {
			navigation.goBack();
		}
	};

	if (parrotId && !parrot) {
		return (
			<Screen>
				<ScreenHeader onBack={canGoBack ? () => navigation.goBack() : undefined} />
			</Screen>
		);
	}

	const renderForm = (flightStyles?: ParrotPhotoFlightStyles) => (
		<ParrotEditorForm
			key={parrot?.id ?? 'new'}
			parrot={parrot}
			canDelete={parrotListData.length > 1}
			intro={fromOnboarding || !parrot}
			onBack={canGoBack ? () => navigation.goBack() : undefined}
			onDone={handleDone}
			photoRef={photoRef}
			photoStyle={flightStyles?.photoStyle}
			badgeStyle={flightStyles?.badgeStyle}
		/>
	);

	if (!params?.photoOrigin) {
		return renderForm();
	}

	return (
		<ParrotPhotoFlight
			origin={params.photoOrigin}
			tilt={params.photoTilt ?? 0}
			targetRef={photoRef}
			photoUri={parrot?.photo?.url ?? null}
		>
			{renderForm}
		</ParrotPhotoFlight>
	);
};

export default ParrotEditorScreen;
