import { useState } from 'react';

import { FlatList, StyleSheet } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { WordsStackParamList } from '@/types/navigation';

import { useGetRunningSession } from '@/hooks/apis/sessions';
import { useDeleteWord, useGetWordList } from '@/hooks/apis/words';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon } from 'lucide-react-native';

import { DeleteWordDialog } from '@/screens/words/components/delete-word-dialog';
import { WordCard } from '@/screens/words/components/word-card';
import { track } from '@/services/telemetry/client';

import { Illustration } from '@/components/illustration';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	player: SoundPlayer;
}

/**
 * 단어 목록 컴포넌트
 * @param player 소리 재생기
 */
const WordList = ({ player }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	const [deleting, setDeleting] = useState<Word | null>(null);

	const { data: wordListData } = useGetWordList();
	const { data: runningSessionData } = useGetRunningSession();

	const { isError, isPending, mutate, reset } = useDeleteWord();

	const learningWordId = runningSessionData?.word_id ?? null;

	const illustration = <Illustration scene={t('words.list.emptyScene')} icon={MessageSquareTextIcon} height={200} />;
	const emptyContent = (
		<EmptyState
			message={t('words.list.empty')}
			illustration={illustration}
			action={{ label: t('words.list.add'), onPress: () => navigation.navigate('WordEditor', {}) }}
		/>
	);

	/** 단어 삭제 */
	const handleDeleteWord = () => {
		if (isPending || !deleting) {
			return;
		}

		mutate(
			{ id: deleting.id },
			{
				onSuccess: () => {
					track('word_deleted', {
						word_id: deleting.id,
						recording_count: deleting.recordings.length,
					});

					setDeleting(null);
				},
			},
		);
	};

	/** 삭제 확인 다이얼로그 닫기 */
	const handleCloseDeleteDialog = () => {
		reset();

		setDeleting(null);
	};

	return (
		<>
			{/*단어 목록*/}
			<FlatList
				data={wordListData}
				keyExtractor={(word) => word.id}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				renderItem={({ item: word }) => (
					<WordCard
						word={word}
						learning={word.id === learningWordId}
						player={player}
						onPress={() => navigation.navigate('WordEditor', { wordId: word.id })}
						onDelete={() => setDeleting(word)}
					/>
				)}
				ListEmptyComponent={emptyContent}
			/>

			{/*삭제 확인 다이얼로그*/}
			<DeleteWordDialog
				visible={deleting !== null}
				name={deleting?.name ?? ''}
				deletion={{ isPending, isError }}
				onConfirm={handleDeleteWord}
				onClose={handleCloseDeleteDialog}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
});

export default WordList;
