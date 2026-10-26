import { StyleSheet } from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

import { seedColors } from '@/theme/seed-colors';

export const SEED_OUTLINE =
	'M16 2.8c4 4.4 6.6 11.2 5.8 18.2-.5 4.4-2.8 7.6-5.8 7.6s-5.3-3.2-5.8-7.6C9.4 14 12 7.2 16 2.8Z';

interface Props {
	side: 'outside' | 'inside';
}

/**
 * 해바라기 씨 껍질 그림 컴포넌트
 * @param side 껍질 바깥쪽 또는 안쪽
 */
const FeedCardLikeButtonHull = ({ side }: Props) => {
	return (
		<Svg viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
			<G transform="rotate(32 16 16)">
				<Path d={SEED_OUTLINE} fill={seedColors.hull} />
				{side === 'outside' ? (
					<>
						<Path
							d="M16 4.6c.5 6.6.5 15.4 0 22.4"
							stroke={seedColors.stripe}
							strokeWidth={1.5}
							strokeLinecap="round"
							fill="none"
						/>
						<Path
							d="M13.3 9.2c-.9 5-1 11 .4 16.4M18.7 9.2c.9 5 1 11-.4 16.4"
							stroke={seedColors.stripeSide}
							strokeWidth={1.2}
							strokeLinecap="round"
							fill="none"
						/>
						<Path
							d="M11.4 15.5c-.2 3.2.3 6.3 1.3 8.6M20.6 15.5c.2 3.2-.3 6.3-1.3 8.6"
							stroke={seedColors.stripeEdge}
							strokeWidth={1}
							strokeLinecap="round"
							fill="none"
						/>
					</>
				) : (
					<>
						<Path
							d="M16 4.7c3.3 3.8 5.3 9.8 4.6 16.1-.4 3.7-2.2 6.3-4.6 6.3s-4.2-2.6-4.6-6.3C10.7 14.5 12.7 8.5 16 4.7Z"
							fill={seedColors.lining}
						/>
						<Path
							d="M13.1 12.6c-.9 3.4-.9 7.2.3 10.2"
							stroke={seedColors.liningShade}
							strokeWidth={1.5}
							strokeLinecap="round"
							fill="none"
						/>
						<Path
							d="M18.9 10.6c.8 2.4 1.2 5 1.1 7.6"
							stroke={seedColors.liningShine}
							strokeWidth={0.9}
							strokeLinecap="round"
							fill="none"
						/>
					</>
				)}
			</G>
		</Svg>
	);
};

export default FeedCardLikeButtonHull;
