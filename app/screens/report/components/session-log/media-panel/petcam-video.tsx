import { StyleSheet } from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';

interface Props {
	url: string;
}

/**
 * 펫캠 영상 재생 컴포넌트
 * @param url 영상 주소
 */
const SessionLogMediaPanelPetcamVideo = ({ url }: Props) => {
	const player = useVideoPlayer(url);

	return (
		<VideoView
			player={player}
			nativeControls
			contentFit="contain"
			fullscreenOptions={{ enable: true }}
			style={StyleSheet.absoluteFill}
		/>
	);
};

export default SessionLogMediaPanelPetcamVideo;
