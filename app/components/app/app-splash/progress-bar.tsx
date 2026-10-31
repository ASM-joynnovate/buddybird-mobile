import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Rect, Text as SvgText } from 'react-native-svg';

import { colors, font } from '@/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const TRACK_X = 210;
const TRACK_Y = 1636;
const TRACK_WIDTH = 440;
const TRACK_HEIGHT = 18;
const TRACK_RADIUS = 9;

interface Props {
	progress: SharedValue<number>;
	percent: number;
}

/**
 * 스플래시 다운로드 진행 막대 컴포넌트
 * @param progress 0에서 1 사이의 진행률 애니메이션 값
 * @param percent 표시할 퍼센트 숫자
 */
const AppSplashProgressBar = ({ progress, percent }: Props) => {
	const fillProps = useAnimatedProps(() => ({ width: TRACK_WIDTH * progress.get() }));

	return (
		<>
			<Rect
				x={TRACK_X}
				y={TRACK_Y}
				width={TRACK_WIDTH}
				height={TRACK_HEIGHT}
				rx={TRACK_RADIUS}
				fill={colors.yellowDark}
			/>
			<AnimatedRect
				x={TRACK_X}
				y={TRACK_Y}
				height={TRACK_HEIGHT}
				rx={TRACK_RADIUS}
				fill={colors.onBrand}
				animatedProps={fillProps}
			/>
			<SvgText
				x={430}
				y={1722}
				textAnchor="middle"
				fontFamily={font.extraBold}
				fontSize={35}
				fill={colors.onBrand}
			>
				{`${percent}%`}
			</SvgText>
		</>
	);
};

export default AppSplashProgressBar;
