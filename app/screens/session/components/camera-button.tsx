import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CameraIcon } from 'lucide-react-native';

import { sessionColors } from '@/theme/session-colors';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ICON_SIZE = 20;
const BUTTON_SIZE = 48;

interface Props {
	cameraOn: boolean;
	loading?: boolean;
	onPress: () => void;
}

/**
 * 카메라 버튼 컴포넌트
 * @param cameraOn 카메라 켜짐 여부
 * @param loading 요청 진행 여부
 * @param onPress 버튼을 누를 때 실행할 함수
 */
const CameraButton = ({ cameraOn, loading = false, onPress }: Props) => {
	const { t } = useTranslation();

	return (
		<PressableSurface
			depth="high"
			cornerRadius="pill"
			edgeColor={cameraOn ? sessionColors.cameraOnEdge : sessionColors.edge}
			faceColor={sessionColors.background}
			contentStyle={styles.face}
			accessibilityRole="switch"
			accessibilityLabel={t('session.run.camera')}
			accessibilityState={{ checked: cameraOn, busy: loading }}
			disabled={loading}
			onPress={onPress}
		>
			{loading ? (
				<ActivityIndicator color={sessionColors.text} />
			) : (
				<CameraIcon size={ICON_SIZE} color={cameraOn ? sessionColors.cameraOn : sessionColors.text} />
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	face: { width: BUTTON_SIZE, height: BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' },
});

export default CameraButton;
