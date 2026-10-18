import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const VIEW_WIDTH = 180;
const VIEW_HEIGHT = 214;

interface Props {
	width: number;
	barColor: string;
	trayColor: string;
	trayEdgeColor: string;
}

/**
 * 새장 그림 컴포넌트
 * @param width 그림 폭
 * @param barColor 창살 색
 * @param trayColor 바닥 판 색
 * @param trayEdgeColor 바닥 판 아래 두께 색
 */
const UsageSceneCage = ({ width, barColor, trayColor, trayEdgeColor }: Props) => {
	return (
		<Svg width={width} height={(width * VIEW_HEIGHT) / VIEW_WIDTH} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
			<G fill="none" stroke={barColor} strokeWidth={5} strokeLinecap="round">
				<Circle cx={90} cy={10} r={6} />
				<Path d="M20 184V84Q20 18 90 18Q160 18 160 84V184M44 184V40M67 184V24M90 184V18M113 184V24M136 184V40M24 150H156" />
			</G>
			<Rect x={8} y={188} width={164} height={24} rx={9} fill={trayEdgeColor} />
			<Rect x={8} y={182} width={164} height={24} rx={9} fill={trayColor} stroke={barColor} strokeWidth={3} />
		</Svg>
	);
};

export default UsageSceneCage;
