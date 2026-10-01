import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { WordsStackParamList } from '@/types/navigation';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrashIcon } from 'lucide-react-native';

import DeleteWordDialog from '@/screens/words/components/delete-word-dialog';
import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	word: Word;
	player: SoundPlayer;
}

/**
 * 단어 카드 컴포넌트
 * @param word 표시할 단어
 * @param player useSoundPlayer 결과
 */
const WordCard = ({ word, player }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const firstRecording = word.recordings[0];
	const playing = player.playingId === word.id;

	return (
		<View>
			<PressableSurface
				depth="low"
				onPress={() => navigation.navigate('WordEditor', { wordId: word.id })}
				contentStyle={styles.card}
			>
				<Copy numberOfLines={1} style={styles.name}>
					{word.name}
				</Copy>
			</PressableSurface>

			<View style={styles.actionsRow}>
				<IconButton
					icon={TrashIcon}
					label={t('words.list.delete', { name: word.name })}
					variant="muted"
					size="small"
					onPress={() => setDeleteDialogOpen(true)}
				/>
				<PlayButton
					playing={playing}
					label={t(playing ? 'common.sound.stopNamed' : 'words.list.play', {
						name: word.name,
					})}
					onPress={() => player.toggle(word.id, firstRecording.url)}
				/>
			</View>

			<DeleteWordDialog
				visible={deleteDialogOpen}
				word={word}
				onClose={() => setDeleteDialogOpen(false)}
				onDeleted={() => setDeleteDialogOpen(false)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	card: { minHeight: 84, padding: 16, paddingRight: 124, justifyContent: 'center' },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	actionsRow: {
		position: 'absolute',
		right: 16,
		top: 0,
		bottom: 2,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
});

export default WordCard;
