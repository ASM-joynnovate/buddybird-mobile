import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CircleQuestionMarkIcon } from 'lucide-react-native';

import { sessionColors } from '@/theme/session-colors';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ICON_SIZE = 20;
const BUTTON_SIZE = 48;

interface Props {
	onPress: () => void;
}

/**
 * 펫캠 안내 열기 버튼 컴포넌트
 * @param onPress 버튼을 누를 때 실행할 함수
 */
const CameraGuideButton = ({ onPress }: Props) => {
	const { t } = useTranslation();

	return (
		<PressableSurface
			depth="high"
			cornerRadius="pill"
			edgeColor={sessionColors.edge}
			faceColor={sessionColors.background}
			contentStyle={styles.face}
			accessibilityRole="button"
			accessibilityLabel={t('session.run.openGuide')}
			onPress={onPress}
		>
			<CircleQuestionMarkIcon size={ICON_SIZE} color={sessionColors.text} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	face: { width: BUTTON_SIZE, height: BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' },
});

export default CameraGuideButton;
