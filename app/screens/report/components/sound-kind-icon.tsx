import { StyleSheet, View } from 'react-native';

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { soundKindColors } from '@/screens/report/components/sound-kind-colors';
import { colors, radius } from '@/theme';
import type { SoundKind } from '@/utils/tape-log';

const EDGE_HEIGHT = 2;
const CUT_WIDTH = 1.4;

const sizes = {
	small: { badge: 20, icon: 14 },
	medium: { badge: 24, icon: 16 },
};

interface Props {
	kind: SoundKind;
	size: keyof typeof sizes;
	muted?: boolean;
}

/**
 * 소리 종류 아이콘 컴포넌트
 * @param kind 소리 종류
 * @param size 배지 크기
 * @param muted 회색으로 보일지 여부
 */
const SoundKindIcon = ({ kind, size, muted = false }: Props) => {
	const { badge, icon } = sizes[size];
	const badgeColor = muted ? colors.subtle : soundKindColors[kind].face;
	const edgeColor = muted ? colors.gray : soundKindColors[kind].edge;
	const iconColor = colors.onFilled;
	const badgeSize = { width: badge, height: badge };

	return (
		<View style={badgeSize}>
			<View style={[styles.edge, badgeSize, { backgroundColor: edgeColor }]} />

			<View style={[styles.face, badgeSize, { backgroundColor: badgeColor }]}>
				<Svg width={icon} height={icon} viewBox="0 0 24 24">
					{kind === 'parrot' && (
						<>
							<Path fill={iconColor} d="M4.6 6.4C3 4.3 4 1.8 6.6 1.9 6 3 6.2 4.2 7.2 4.9Z" />
							<Circle fill={iconColor} cx="10" cy="12.5" r="8" />
							<Path
								fill={badgeColor}
								stroke={badgeColor}
								strokeWidth={CUT_WIDTH}
								d="M14.2 6.6c5-1.2 8.2 2.3 7.4 6.3-.4 2.2-2 3.5-3.9 3.7.8-2-.1-4.2-2.7-5Z"
							/>
							<Path
								fill={iconColor}
								d="M14.2 6.6c5-1.2 8.2 2.3 7.4 6.3-.4 2.2-2 3.5-3.9 3.7.8-2-.1-4.2-2.7-5Z"
							/>
							<Path
								fill={badgeColor}
								stroke={badgeColor}
								strokeWidth={CUT_WIDTH}
								d="M15 12.3c2 .4 2.7 2.1 1.9 3.4-1-.1-1.9-.9-2.1-2Z"
							/>
							<Path fill={iconColor} d="M15 12.3c2 .4 2.7 2.1 1.9 3.4-1-.1-1.9-.9-2.1-2Z" />
							<Circle fill={badgeColor} cx="10.8" cy="10" r="1.9" />
						</>
					)}

					{kind === 'mimic' && (
						<>
							<Path
								fill={iconColor}
								d="M5.5 3.5h13a3.5 3.5 0 0 1 3.5 3.5v7.5a3.5 3.5 0 0 1-3.5 3.5h-6.3l-4.6 3.6c-.6.5-1.6 0-1.6-.8V18h-.5A3.5 3.5 0 0 1 2 14.5V7a3.5 3.5 0 0 1 3.5-3.5Z"
							/>
							<Rect fill={badgeColor} x="6.4" y="9" width="2.4" height="4.5" rx="1.2" />
							<Rect fill={badgeColor} x="10.8" y="6.8" width="2.4" height="8.9" rx="1.2" />
							<Rect fill={badgeColor} x="15.2" y="8.4" width="2.4" height="5.7" rx="1.2" />
						</>
					)}

					{kind === 'emergency' && (
						<>
							<Path fill={iconColor} d="M6 17.5V12a6 6 0 0 1 12 0v5.5Z" />
							<Rect fill={iconColor} x="3.5" y="18" width="17" height="3.8" rx="1.6" />
							<Rect fill={badgeColor} x="8.6" y="10.4" width="2" height="5" rx="1" />
							<Path
								stroke={iconColor}
								strokeWidth={2.2}
								strokeLinecap="round"
								d="M12 1.6v2.2M4.3 4.6l1.5 1.5M19.7 4.6l-1.5 1.5M1.8 11.6h2M20.2 11.6h2"
							/>
						</>
					)}
				</Svg>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	edge: { position: 'absolute', top: EDGE_HEIGHT, left: 0, borderRadius: radius.pill },
	face: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});

export default SoundKindIcon;
