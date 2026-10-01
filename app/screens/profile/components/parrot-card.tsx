import { Image, StyleSheet, View } from 'react-native';

import type { Parrot } from '@/types/apis/parrots';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BirdIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { dropIn } from '@/screens/profile/components/parrot-card-animations';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import { ageMonths } from '@/utils/date';
import { isSpeciesId } from '@/utils/species';
import { MONTHS_PER_YEAR } from '@/utils/units';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Tag } from '@/components/ui/tag';

interface Props {
	parrot: Parrot;
	tilt: number;
	order: number;
}

/**
 * 사진이 위를 채우고 아래에 이름, 종, 나이가 오는 앵무새 카드 컴포넌트
 * @param parrot 표시할 앵무새
 * @param tilt 카드 기울기 각도
 * @param order 처음 나타날 때 떨어지는 순서
 */
const ParrotCard = ({ parrot, tilt, order }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const ageInMonths = ageMonths(parrot.birthdate);
	const speciesName = isSpeciesId(parrot.species) ? t(`parrot.speciesNames.${parrot.species}`) : parrot.species;
	let ageText: string | null = null;

	if (ageInMonths !== null) {
		ageText =
			ageInMonths < MONTHS_PER_YEAR
				? t('profile.ageMonths', { count: ageInMonths })
				: t('profile.ageYears', { count: Math.floor(ageInMonths / MONTHS_PER_YEAR) });
	}

	return (
		<Animated.View entering={dropIn(tilt, order)} style={[ui.action, { transform: [{ rotate: `${tilt}deg` }] }]}>
			<PressableSurface
				accessibilityLabel={joinLabel(t('profile.editParrot', { name: parrot.name }), speciesName, ageText)}
				depth="low"
				onPress={() => navigation.navigate('ParrotEditor', { parrotId: parrot.id })}
				style={styles.card}
				contentStyle={styles.cardContent}
			>
				<View style={styles.photo}>
					{parrot.photo ? (
						<Image
							source={{ uri: parrot.photo.url }}
							style={styles.image}
							accessibilityIgnoresInvertColors
						/>
					) : (
						<BirdIcon size={40} color={colors.subtle} />
					)}
				</View>

				<Copy numberOfLines={1} style={styles.name}>
					{parrot.name}
				</Copy>

				{/*종 태그가 먼저 줄어들고 나이 태그는 그대로 남음*/}
				<View style={styles.tags}>
					<Tag label={speciesName} />
					{ageText && (
						<View style={styles.ageTag}>
							<Tag label={ageText} />
						</View>
					)}
				</View>
			</PressableSurface>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	card: { flex: 1 },
	cardContent: { flex: 1, gap: 8, padding: 10, paddingBottom: 12 },
	photo: {
		aspectRatio: 1,
		overflow: 'hidden',
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: { width: '100%', height: '100%' },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24, paddingHorizontal: 2 },
	tags: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
	ageTag: { flexShrink: 0 },
});

export default ParrotCard;
