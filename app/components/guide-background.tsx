import type { ReactNode } from 'react';

import { View } from 'react-native';

import useIsLandscape from '@/hooks/use-is-landscape';

import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { contentMaxWidth } from '@/theme';

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

	const isLandscape = useIsLandscape();

	return (
		<Animated.View style={[styles.container, { backgroundColor }, !motionReduced && styles.backgroundTransition]}>
			{/*가로 모드에서는 가운데 열에만 표시*/}
			<View style={[styles.content, isLandscape && styles.column]}>{children}</View>
		</Animated.View>
	);
};

const styles = css.create({
	container: { flex: 1 },
	content: { flex: 1 },
	column: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	backgroundTransition: { transitionProperty: 'backgroundColor', transitionDuration: BACKGROUND_TRANSITION_MS },
});

export default GuideBackground;
