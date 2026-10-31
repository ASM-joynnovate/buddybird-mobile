import { type ReactNode, useCallback, useMemo } from 'react';

import { BackHandler } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
	stepIndex: number;
	stepCount: number;
	onStepChange: (stepIndex: number) => void;
	children: ReactNode;
}

/**
 * 스와이프로 안내 단계를 변경하는 컴포넌트
 * @param stepIndex 현재 단계 순서
 * @param stepCount 전체 단계 수
 * @param onStepChange 단계 변경 시 실행할 함수
 * @param children 스와이프를 감지할 화면
 */
const GuidePager = ({ stepIndex, stepCount, onStepChange, children }: Props) => {
	const swipeGesture = useMemo(
		() =>
			Gesture.Race(
				Gesture.Fling()
					.enabled(stepIndex < stepCount - 1)
					.direction(Directions.LEFT)
					.onStart(() => {
						scheduleOnRN(onStepChange, stepIndex + 1);
					}),
				Gesture.Fling()
					.enabled(stepIndex > 0)
					.direction(Directions.RIGHT)
					.onStart(() => {
						scheduleOnRN(onStepChange, stepIndex - 1);
					}),
			),
		[onStepChange, stepCount, stepIndex],
	);

	/** 안드로이드 뒤로 가기 버튼으로 이전 단계 이동 */
	useFocusEffect(
		useCallback(() => {
			if (stepIndex === 0) {
				return;
			}

			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				onStepChange(stepIndex - 1);

				return true;
			});

			return () => subscription.remove();
		}, [onStepChange, stepIndex]),
	);

	return <GestureDetector gesture={swipeGesture}>{children}</GestureDetector>;
};

export default GuidePager;
