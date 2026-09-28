import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import { MAX_RECORDINGS, RECOMMENDED_RECORDINGS } from '@/types/apis/words';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { CircleQuestionMarkIcon, MicIcon } from 'lucide-react-native';

import { RecordingItem } from '@/screens/words/components/recordings-section/recording-item';
import type { DraftItem, WordDraft } from '@/screens/words/hooks/use-word-draft';
import { colors, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

interface Props {
	draft: WordDraft;
	player: SoundPlayer;
	onDelete(item: DraftItem, name: string): void;
	onAdd(): void;
	onHelp(): void;
}

export function RecordingsSection({ draft, player, onDelete, onAdd, onHelp }: Props): ReactElement {
	const { t } = useTranslation();

	const disabled = draft.step !== null;
	const items = draft.items;

	return (
		<View style={ui.section}>
			<View style={styles.header}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('words.editor.recordings', { count: items.length })}
				</Copy>
				<IconButton
					icon={CircleQuestionMarkIcon}
					label={t('words.editor.guide')}
					variant="muted"
					onPress={onHelp}
				/>
			</View>
			{items.map((item, index) => {
				const deletable = !disabled && !(item.kind === 'server' && draft.serverCount <= 1);

				return (
					<RecordingItem
						key={item.id}
						item={item}
						player={player}
						index={index}
						onDelete={deletable ? (name) => onDelete(item, name) : undefined}
					/>
				);
			})}
			<InlineError message={player.failedId ? t('common.sound.playError') : null} />
			<InlineError message={draft.missingRecording ? t('words.editor.recordingRequired') : null} />
			{items.length < MAX_RECORDINGS ? (
				<Button
					label={t('words.editor.addRecording')}
					icon={MicIcon}
					variant="secondary"
					disabled={disabled}
					onPress={onAdd}
					style={styles.add}
				/>
			) : null}
			{items.length < RECOMMENDED_RECORDINGS ? (
				<Copy style={styles.hint}>{t('words.editor.recommend')}</Copy>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
	title: { flex: 1, fontSize: 18, lineHeight: 24, fontFamily: font.black },
	add: { marginTop: 12 },
	hint: { color: colors.muted, marginTop: 10 },
});
