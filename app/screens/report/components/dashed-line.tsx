import Svg, { Line } from 'react-native-svg';

const LINE_WIDTH = 2;
const DASH_PATTERN = '6 4';

interface Props {
	color: string;
}

/**
 * 점선 컴포넌트
 * @param color 선 색
 */
const DashedLine = ({ color }: Props) => {
	return (
		<Svg width="100%" height={LINE_WIDTH}>
			<Line
				x1="0"
				y1={LINE_WIDTH / 2}
				x2="100%"
				y2={LINE_WIDTH / 2}
				stroke={color}
				strokeWidth={LINE_WIDTH}
				strokeDasharray={DASH_PATTERN}
			/>
		</Svg>
	);
};

export default DashedLine;
