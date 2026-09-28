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
	onSelect(id: string): void;
}

export function WordChoice({ word, selected, player, onSelect }: Props) {
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
			{/*단어 이름과 태그*/}
			<View style={styles.textContainer}>
				<Copy numberOfLines={1} style={[styles.name, !firstRecording && styles.nameDisabled]}>
					{word.name}
				</Copy>
				{firstRecording ? null : <Tag label={t('common.needsRecording')} />}
			</View>

			{/*미리 듣기 버튼*/}
			{firstRecording ? (
				<PlayButton
					playing={playing}
					label={t(playing ? 'common.sound.stop' : 'session.start.previewRecording', {
						name: word.name,
					})}
					onPress={() => player.toggle(word.id, firstRecording.url)}
				/>
			) : null}
		</ChoiceCard>
	);
}

const styles = StyleSheet.create({
	card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72 },
	textContainer: { flex: 1, minWidth: 0, gap: 6 },
	name: { fontFamily: font.black, fontSize: 18, color: colors.text },
	nameDisabled: { color: colors.subtle },
});
