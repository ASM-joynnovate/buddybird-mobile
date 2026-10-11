import { StyleSheet, View } from 'react-native';

import { CameraView } from 'expo-camera';

import { reportError } from '@/services/telemetry/client';
import { sessionColors } from '@/theme/session-colors';

/** 학습 화면 뒤에 깔리는 Station 카메라 영상 컴포넌트 */
const StationCamera = () => {
	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			<CameraView
				style={StyleSheet.absoluteFill}
				facing="front"
				animateShutter={false}
				onMountError={(event) => reportError(new Error(event.message), 'station_camera')}
			/>

			{/*학습 정보가 잘 보이도록 영상을 어둡게 덮음*/}
			<View style={styles.scrim} />
		</View>
	);
};

const styles = StyleSheet.create({
	scrim: { ...StyleSheet.absoluteFill, backgroundColor: sessionColors.videoScrim },
});

export default StationCamera;
