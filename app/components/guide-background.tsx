import type { ReactNode } from 'react';

import Animated, { css, useReducedMotion } from 'react-native-reanimated';

const BACKGROUND_TRANSITION_MS = 420;

interface Props {
	backgroundColor: string;
	children: ReactNode;
}

/**
 * 단계별 색이 변하는 안내 화면 배경 컴포넌트
 * @param backgroundColor 현재 단계의 배경색
 * @param children 배경 위에 놓을 내용
 */
const GuideBackground = ({ backgroundColor, children }: Props) => {
	const motionReduced = useReducedMotion();

	return (
		<Animated.View style={[styles.container, { backgroundColor }, !motionReduced && styles.backgroundTransition]}>
			{children}
		</Animated.View>
	);
};

const styles = css.create({
	container: { flex: 1 },
	backgroundTransition: { transitionProperty: 'backgroundColor', transitionDuration: BACKGROUND_TRANSITION_MS },
});

export default GuideBackground;
