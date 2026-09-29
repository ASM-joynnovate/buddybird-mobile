import { FlatList, StyleSheet } from 'react-native';

import type { WordsStackParamList } from '@/types/navigation';

import { useGetRunningSession } from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon } from 'lucide-react-native';

import WordCard from '@/screens/words/components/word-card';

import Illustration from '@/components/illustration';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	player: SoundPlayer;
}

/**
 * 단어 카드 목록 컴포넌트
 * @param player useSoundPlayer 결과
 */
const WordList = ({ player }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	const { data: wordListData } = useGetWordList();
	const { data: runningSessionData } = useGetRunningSession();

	const learningWordId = runningSessionData?.word_id ?? null;

	const illustration = <Illustration scene={t('words.list.emptyScene')} icon={MessageSquareTextIcon} height={200} />;
	const emptyContent = (
		<EmptyState
			message={t('words.list.empty')}
			illustration={illustration}
			action={{ label: t('words.list.add'), onPress: () => navigation.navigate('WordEditor', {}) }}
		/>
	);

	return (
		<FlatList
			data={wordListData}
			keyExtractor={(word) => word.id}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item: word }) => (
				<WordCard word={word} learning={word.id === learningWordId} player={player} />
			)}
			ListEmptyComponent={emptyContent}
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
});

export default WordList;
