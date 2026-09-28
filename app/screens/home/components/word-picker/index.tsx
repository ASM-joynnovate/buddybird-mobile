import { StyleSheet } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import WordChoice from '@/screens/home/components/word-picker/word-choice';

interface Props {
	words: readonly Word[];
	selectedId: string | null;
	player: SoundPlayer;
	onSelect: (id: string) => void;
}

/**
 * 단어와 미리 듣기 버튼을 보여 주고 누르면 그 단어를 고르는 목록 컴포넌트
 * @param words 고를 수 있는 단어 목록
 * @param selectedId 고른 단어 ID
 * @param player 녹음을 재생하고 멈추는 useSoundPlayer 결과
 * @param onSelect 단어를 고를 때 실행할 함수
 */
const WordPicker = ({ words, selectedId, player, onSelect }: Props) => {
	return (
		<BottomSheetFlatList
			data={words}
			keyExtractor={(word) => word.id}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item: word }) => (
				<WordChoice word={word} selected={word.id === selectedId} player={player} onSelect={onSelect} />
			)}
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 10, paddingHorizontal: 24, paddingBottom: 20 },
});

export default WordPicker;
