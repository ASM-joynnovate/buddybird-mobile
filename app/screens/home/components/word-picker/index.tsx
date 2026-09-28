import { StyleSheet } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { WordChoice } from '@/screens/home/components/word-picker/word-choice';

interface Props {
	words: readonly Word[];
	selectedId: string | null;
	player: SoundPlayer;
	onSelect(id: string): void;
}

export function WordPicker({ words, selectedId, player, onSelect }: Props) {
	return (
		<BottomSheetFlatList
			data={words}
			keyExtractor={(word) => word.id}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item }) => (
				<WordChoice word={item} selected={item.id === selectedId} player={player} onSelect={onSelect} />
			)}
		/>
	);
}

const styles = StyleSheet.create({
	list: { gap: 10, paddingHorizontal: 24, paddingBottom: 20 },
});
