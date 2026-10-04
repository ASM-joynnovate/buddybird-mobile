import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlusIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { dropIn } from '@/screens/profile/components/parrot-card-animations';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { Surface } from '@/components/ui/surface';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	tilt: number;
	order: number;
}

/**
 * 앵무새 카드 목록의 마지막 칸에서 앵무새 등록으로 이동하는 카드 컴포넌트
 * @param tilt 카드 기울기 각도
 * @param order 처음 나타날 때 떨어지는 순서
 */
const AddParrotCard = ({ tilt, order }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Animated.View entering={dropIn(tilt, order)} style={[ui.action, { transform: [{ rotate: `${tilt}deg` }] }]}>
			<PressableSurface
				accessibilityLabel={t('profile.addParrot')}
				depth="low"
				faceColor={colors.surface}
				onPress={() => navigation.navigate('ParrotEditor')}
				style={styles.card}
				contentStyle={styles.cardContent}
			>
				<Surface variant="primary" cornerRadius="pill" contentStyle={styles.plus}>
					<PlusIcon size={26} color={colors.onFilled} />
				</Surface>
				<Copy style={styles.label}>{t('profile.addParrot')}</Copy>
			</PressableSurface>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	card: { flex: 1 },
	cardContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
	plus: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
	label: { fontFamily: font.extraBold, color: colors.muted },
});

export default AddParrotCard;
