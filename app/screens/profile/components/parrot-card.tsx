import type { Parrot } from '@/types/apis/parrots';

import { useTranslation } from 'react-i18next';

import { ImageIcon } from 'lucide-react-native';

import ProfileCard from '@/screens/profile/components/profile-card';
import { joinLabel } from '@/utils/a11y';
import { ageMonths } from '@/utils/date';
import { isSpeciesId } from '@/utils/species';
import { MONTHS_PER_YEAR } from '@/utils/units';

interface Props {
	parrot: Parrot;
	onPress: () => void;
}

/**
 * 앵무새 사진, 이름, 종, 나이를 보여 주는 카드 컴포넌트
 * @param parrot 보여 줄 앵무새
 * @param onPress 카드를 누를 때 실행할 함수
 */
const ParrotCard = ({ parrot, onPress }: Props) => {
	const { t } = useTranslation();

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
			onPress={onPress}
		/>
	);
};

export default ParrotCard;
