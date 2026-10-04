import { FlatList, StyleSheet } from 'react-native';

import { useGetWordList } from '@/hooks/apis/words';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import WordCard from '@/screens/words/components/word-card';

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

	const { data: wordListData } = useGetWordList();

	return (
		<FlatList
			data={wordListData}
			keyExtractor={(word) => word.id}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item: word }) => <WordCard word={word} player={player} />}
			ListEmptyComponent=<EmptyState message={t('words.list.empty')} />
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
});

export default WordList;
