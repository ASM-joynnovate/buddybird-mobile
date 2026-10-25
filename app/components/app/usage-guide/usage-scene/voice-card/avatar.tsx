import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

import { colors } from '@/theme';

const AVATAR_SIZE = 26;

/** 보호자 아바타 컴포넌트 */
const UsageSceneVoiceCardAvatar = () => {
	return (
		<Svg width={AVATAR_SIZE} height={AVATAR_SIZE} viewBox="0 0 40 40">
			<Defs>
				<ClipPath id="voice-avatar">
					<Circle cx="20" cy="20" r="20" />
				</ClipPath>
			</Defs>
			<Circle cx="20" cy="20" r="20" fill={colors.orangePale} />
			<G clipPath="url(#voice-avatar)" fill={colors.text}>
				<Circle cx="20" cy="16" r="8" />
				<Path d="M4 42c0-10 7-16 16-16s16 6 16 16Z" />
			</G>
			<Circle cx="20" cy="20" r="19" fill="none" stroke={colors.orange} strokeWidth={2} />
		</Svg>
	);
};

export default UsageSceneVoiceCardAvatar;
