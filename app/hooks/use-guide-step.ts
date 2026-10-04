import { useCallback, useEffect, useState } from 'react';

import { BackHandler } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

/** 안내 단계 Hook */
const useGuideStep = () => {
	const navigation = useNavigation();

	const [stepIndex, setStepIndex] = useState(0);

	/** 첫 단계에서만 스와이프로 뒤로 가기 허용 */
	useEffect(() => {
		navigation.setOptions({ gestureEnabled: stepIndex === 0 });
	}, [stepIndex, navigation]);

	/** 안드로이드 뒤로 가기 버튼으로 이전 단계 이동 */
	useFocusEffect(
		useCallback(() => {
			if (stepIndex === 0) {
				return;
			}

			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				setStepIndex(stepIndex - 1);

				return true;
			});

			return () => subscription.remove();
		}, [stepIndex]),
	);

	return { stepIndex, setStepIndex };
};

export default useGuideStep;
