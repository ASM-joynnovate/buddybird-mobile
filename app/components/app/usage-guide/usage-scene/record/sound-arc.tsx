import Animated, { interpolate, type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Path } from 'react-native-svg';

import { colors } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const SOUND_ARCS = ['M8 28c8 6 8 18 0 24', 'M22 18c14 10 14 34 0 44', 'M36 8c20 14 20 50 0 64'];

interface Props {
	path: string;
	index: number;
	progress: SharedValue<number>;
	animated: boolean;
}

/**
 * 소리 물결 한 겹 컴포넌트
 * @param path 물결 모양
 * @param index 태블릿에서 가까운 순서
 * @param progress 물결 애니메이션 진행도
 * @param animated 애니메이션 실행 여부
 */
const UsageSceneRecordSoundArc = ({ path, index, progress, animated }: Props) => {
	const arcProps = useAnimatedProps(() => {
		if (!animated) {
			return { opacity: 1 };
		}

		const phase = (progress.get() - index / SOUND_ARCS.length + 1) % 1;

		return { opacity: interpolate(phase, [0, 0.15, 0.6, 1], [0.15, 1, 0.15, 0.15]) };
	});

	return (
		<AnimatedPath
			animatedProps={arcProps}
			d={path}
			fill="none"
			stroke={colors.orange}
			strokeWidth={5}
			strokeLinecap="round"
		/>
	);
};

export default UsageSceneRecordSoundArc;
