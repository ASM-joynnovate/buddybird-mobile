import { StyleSheet, View } from 'react-native';

import type { Word } from '@/types/apis/words';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PlayButton } from '@/components/ui/play-button';
import { ChoiceCard } from '@/components/ui/surface/choice-card';
import { Tag } from '@/components/ui/tag';

interface Props {
	word: Word;
	selected: boolean;
	player: SoundPlayer;
	onSelect: (id: string) => void;
}

/**
 * 단어 이름, 첫 녹음 미리 듣기 버튼, 녹음이 없으면 녹음 필요 표시를 보여 주고 누르면 그 단어를 고르는 컴포넌트
 * @param word 보여 줄 단어
 * @param selected 고른 단어 여부
 * @param player 녹음을 재생하고 멈추는 useSoundPlayer 결과
 * @param onSelect 단어를 고를 때 실행할 함수
 */
const WordChoice = ({ word, selected, player, onSelect }: Props) => {
	const { t } = useTranslation();

	const firstRecording = word.recordings[0];
	const playing = player.playingId === word.id;

	return (
		<ChoiceCard
			selected={selected}
			disabled={!firstRecording}
			onPress={() => onSelect(word.id)}
			accessibilityLabel={word.name}
			contentStyle={styles.card}
		>
			{/*단어 이름과 녹음 필요 표시*/}
			<View style={styles.textContainer}>
				<Copy numberOfLines={1} style={[styles.name, !firstRecording && styles.nameDisabled]}>
					{word.name}
				</Copy>
				{!firstRecording && <Tag label={t('common.needsRecording')} />}
			</View>

			{/*미리 듣기 버튼*/}
			{firstRecording && (
				<PlayButton
					playing={playing}
					label={t(playing ? 'common.sound.stop' : 'session.start.previewRecording', {
						name: word.name,
					})}
					onPress={() => player.toggle(word.id, firstRecording.url)}
				/>
			)}
		</ChoiceCard>
	);
};

const styles = StyleSheet.create({
	card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72 },
	textContainer: { flex: 1, minWidth: 0, gap: 6 },
	name: { fontFamily: font.black, fontSize: 18, color: colors.text },
	nameDisabled: { color: colors.subtle },
});

export default WordChoice;
