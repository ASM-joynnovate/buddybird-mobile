import { useTranslation } from 'react-i18next';

import { CheckIcon, XIcon } from 'lucide-react-native';

import RecordingSceneSameWordExampleCard from '@/screens/words/components/recording-scene/same-word/example-card';
import { colors } from '@/theme';

interface Props {
	scale: number;
}

/**
 * 한 단어에 그 단어만 녹음하는 장면 컴포넌트
 * @param scale 그림 배율
 */
const RecordingSceneSameWord = ({ scale }: Props) => {
	const { t } = useTranslation();

	const word = t('words.guide.word');

	return (
		<>
			<RecordingSceneSameWordExampleCard
				scale={scale}
				left={24}
				appearOrder={0}
				icon={CheckIcon}
				label={t('words.guide.goodLabel')}
				words={[word, word, word]}
				backgroundColor={colors.greenDark}
			/>
			<RecordingSceneSameWordExampleCard
				scale={scale}
				left={195}
				appearOrder={4}
				icon={XIcon}
				label={t('words.guide.badLabel')}
				words={[word, ...t('words.guide.otherWords', { returnObjects: true })]}
				backgroundColor={colors.error}
			/>
		</>
	);
};

export default RecordingSceneSameWord;
