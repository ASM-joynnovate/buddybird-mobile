import { type ReactElement, useState } from 'react';

import { FlatList, StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { Word } from '@/types/apis/words';

import type { WordsStackParamList } from '@/types/navigation';

import { getRunningSessionOptions } from '@/hooks/apis/sessions';
import { getWordListOptions, useDeleteWord } from '@/hooks/apis/words';
import { useSoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon, PlusIcon } from 'lucide-react-native';

import { DeleteWordDialog } from '@/screens/words/components/delete-word-dialog';
import { WordCard } from '@/screens/words/components/word-card';
import { track } from '@/services/telemetry/client';
import { contentMaxWidth } from '@/theme';

import { Illustration } from '@/components/illustration';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function WordListScreen(): ReactElement {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	const [deleting, setDeleting] = useState<Word | null>(null);

	const {
		data: wordListData,
		isPending: isWordListPending,
		isError: isWordListError,
		refetch,
	} = useQuery(getWordListOptions());
	const { data: runningSessionData } = useQuery(getRunningSessionOptions());

	const { isError, isPending, mutate, reset } = useDeleteWord();

	const player = useSoundPlayer();

	const learningWordId = runningSessionData?.word_id ?? null;

	const addWord = () => navigation.navigate('WordEditor', {});

	const addButton = <IconButton icon={PlusIcon} label={t('words.list.add')} onPress={addWord} />;
	const illustration = <Illustration scene={t('words.list.emptyScene')} icon={MessageSquareTextIcon} height={200} />;
	const empty = (
		<EmptyState
			message={t('words.list.empty')}
			illustration={illustration}
			action={{ label: t('words.list.add'), onPress: addWord }}
		/>
	);

	let body: ReactElement;

	if (isWordListPending) {
		body = <Skeleton rows={4} height={84} />;
	} else if (isWordListError) {
		body = <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
	} else {
		body = (
			<FlatList
				data={wordListData}
				keyExtractor={(word) => word.id}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				renderItem={({ item }) => (
					<WordCard
						word={item}
						learning={item.id === learningWordId}
						player={player}
						onPress={() => navigation.navigate('WordEditor', { wordId: item.id })}
						onDelete={() => setDeleting(item)}
					/>
				)}
				ListEmptyComponent={empty}
			/>
		);
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				{/*헤더*/}
				<ScreenHeader title={t('words.list.title')} large right={addButton} />

				{/*단어 목록*/}
				<InlineError message={player.failedId ? t('common.sound.playError') : null} />
				{body}
			</View>

			{/*삭제 확인 다이얼로그*/}
			<DeleteWordDialog
				visible={deleting !== null}
				name={deleting?.name ?? ''}
				deletion={{ isPending, isError }}
				onConfirm={() => {
					if (deleting) {
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
					}
				}}
				onClose={() => {
					reset();

					setDeleting(null);
				}}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	list: { gap: 12, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
});
