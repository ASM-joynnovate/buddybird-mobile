import { StyleSheet, View } from 'react-native';

import { type MediaStream, RTCView } from 'react-native-webrtc';

import { sessionColors } from '@/theme/session-colors';

interface Props {
	stream: MediaStream;
}

/**
 * 학습 화면 뒤에 깔리는 Station 카메라 영상 컴포넌트
 * @param stream 보여 줄 카메라 영상
 */
const StationCamera = ({ stream }: Props) => {
	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			<RTCView streamURL={stream.toURL()} objectFit="cover" style={StyleSheet.absoluteFill} />

			{/*학습 정보가 잘 보이도록 영상을 어둡게 덮음*/}
			<View style={styles.scrim} />
		</View>
	);
};

const styles = StyleSheet.create({
	scrim: { ...StyleSheet.absoluteFill, backgroundColor: sessionColors.videoScrim },
});

export default StationCamera;
