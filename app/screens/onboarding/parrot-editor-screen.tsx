import { useCallback } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useGetParrotList } from '@/hooks/apis/parrots';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ParrotEditorForm from '@/screens/onboarding/components/parrot-editor-form';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

/** route params의 앵무새를 수정하거나 새 앵무새를 등록하는 입력을 보여 주고 저장을 마치면 다음 온보딩 화면이나 이전 화면으로 이동하는 화면 */
const ParrotEditorScreen = () => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const params = useRoute<RouteProp<RootStackParamList, 'ParrotEditor'>>().params;

	const { data: parrotListData } = useGetParrotList();

	const parrotId = params?.parrotId;
	const fromOnboarding = params?.source === 'onboarding';
	const canGoBack = navigation.canGoBack();
	const parrot = parrotId ? parrotListData.find(({ id }) => id === parrotId) : undefined;

	/** 온보딩에서 화면에 들어올 때마다 onboarding_step_viewed 전송 */
	useFocusEffect(
		useCallback(() => {
			if (fromOnboarding) {
				trackOnboardingStepViewed('parrot');
			}
		}, [fromOnboarding]),
	);

	/** 온보딩이면 앵무새 단계 완료 전송과 사용 안내 화면 이동, 아니면 이전 화면으로 이동 */
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
				{/*뒤로 가기 버튼*/}
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
			onDone={handleDone}
		/>
	);
};

export default ParrotEditorScreen;
