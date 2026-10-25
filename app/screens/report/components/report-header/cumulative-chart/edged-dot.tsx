import { Circle, Group } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme';

interface Props {
	x: number;
	y: number;
	radius: number;
	color: string;
	opacity?: SharedValue<number>;
}

/**
 * 흰 테두리가 있는 점 컴포넌트
 * @param x 점의 x 좌표
 * @param y 점의 y 좌표
 * @param radius 점의 반지름
 * @param color 점의 색
 * @param opacity 점의 불투명도
 */
const ReportHeaderCumulativeChartEdgedDot = ({ x, y, radius, color, opacity }: Props) => {
	return (
		<Group opacity={opacity}>
			<Circle cx={x} cy={y} r={radius + 1.5} color={colors.background} />
			<Circle cx={x} cy={y} r={radius - 1.5} color={color} />
		</Group>
	);
};

export default ReportHeaderCumulativeChartEdgedDot;
