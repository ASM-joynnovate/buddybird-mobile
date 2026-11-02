import type { ReactNode } from 'react';

import type { ReportGuideStep, ReportGuideTargetRegister } from '@/types/guide/report';

import Animated, { useAnimatedRef } from 'react-native-reanimated';

interface Props {
	step: ReportGuideStep;
	children: ReactNode;
	onRegister: ReportGuideTargetRegister;
}

/**
 * 강조할 요소의 위치 등록 컴포넌트
 * @param step 강조할 단계
 * @param children 강조할 내용
 * @param onRegister 강조 영역 등록 함수
 */
const ReportGuideTarget = ({ step, children, onRegister }: Props) => {
	const targetRef = useAnimatedRef<Animated.View>();

	return (
		<Animated.View ref={targetRef} collapsable={false} onLayout={() => onRegister(step, targetRef)}>
			{children}
		</Animated.View>
	);
};

export default ReportGuideTarget;
