import type { Parrot } from '@/types/apis/parrots';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ImageIcon } from 'lucide-react-native';

import ProfileCard from '@/screens/profile/components/profile-card';
import { joinLabel } from '@/utils/a11y';
import { ageMonths } from '@/utils/date';
import { isSpeciesId } from '@/utils/species';
import { MONTHS_PER_YEAR } from '@/utils/units';

interface Props {
	parrot: Parrot;
}

/**
 * 앵무새 카드 컴포넌트
 * @param parrot 표시할 앵무새
 */
const ParrotCard = ({ parrot }: Props) => {
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
		<ProfileCard
			avatar={{ uri: parrot.photo?.url, icon: ImageIcon, size: 'medium' }}
			title={{ text: parrot.name }}
			details={[speciesName, ageText]}
			label={joinLabel(t('profile.editParrot', { name: parrot.name }), speciesName, ageText)}
			onPress={() => navigation.navigate('ParrotEditor', { parrotId: parrot.id })}
		/>
	);
};

export default ParrotCard;
