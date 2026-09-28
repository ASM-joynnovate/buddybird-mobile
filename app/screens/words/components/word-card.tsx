import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { WordsStackParamList } from '@/types/navigation';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrashIcon } from 'lucide-react-native';

import { MAX_RECORDINGS } from '@/config';
import DeleteWordDialog from '@/screens/words/components/delete-word-dialog';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Tag } from '@/components/ui/tag';

interface Props {
	word: Word;
	learning: boolean;
	player: SoundPlayer;
}

/**
 * 단어 이름과 녹음 개수, 삭제와 재생 버튼을 보여 주고 카드를 누르면 단어 편집 화면을 여는 컴포넌트
 * @param word 보여 줄 단어
 * @param learning 이 단어로 학습 중인지 여부
 * @param player 단어의 첫 녹음을 재생하고 멈추는 useSoundPlayer 결과
 */
const WordCard = ({ word, learning, player }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const firstRecording = word.recordings[0];
	const playing = player.playingId === word.id;
	const recordingCount = word.recordings.length;

	return (
		<View>
			{/*단어 이름, 녹음 개수, 학습 중과 녹음 필요 표시*/}
			<PressableSurface
				depth="low"
				onPress={() => navigation.navigate('WordEditor', { wordId: word.id })}
				accessibilityLabel={joinLabel(
					word.name,
					t('words.list.recordingCount', { count: recordingCount }),
					learning && t('words.list.learning'),
					recordingCount === 0 && t('common.needsRecording'),
				)}
				contentStyle={styles.card}
			>
				<Copy numberOfLines={1} style={styles.name}>
					{word.name}
				</Copy>

				<View style={styles.meta}>
					<View style={styles.dots}>
						{Array.from({ length: MAX_RECORDINGS }, (_, index) => (
							<View key={index} style={[styles.dot, index < recordingCount && styles.dotFilled]} />
						))}
					</View>
					{learning && <Tag label={t('words.list.learning')} variant="primary" />}
					{recordingCount === 0 && <Tag label={t('common.needsRecording')} variant="muted" />}
				</View>
			</PressableSurface>

			{/*삭제와 재생 버튼*/}
			<View style={styles.actions}>
				<IconButton
					icon={TrashIcon}
					label={t('words.list.delete', { name: word.name })}
					variant="muted"
					size="small"
					onPress={() => setDeleteDialogOpen(true)}
				/>
				{firstRecording && (
					<PlayButton
						playing={playing}
						label={t(playing ? 'common.sound.stopNamed' : 'words.list.play', {
							name: word.name,
						})}
						onPress={() => player.toggle(word.id, firstRecording.url)}
					/>
				)}
			</View>

			{/*삭제 확인 다이얼로그*/}
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
	card: { minHeight: 84, padding: 16, paddingRight: 124, gap: 10, justifyContent: 'center' },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	meta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
	dots: { flexDirection: 'row', gap: 4 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
	dotFilled: { backgroundColor: colors.orange },
	actions: {
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
