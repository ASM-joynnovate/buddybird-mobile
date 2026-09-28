import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CircleQuestionMarkIcon, MicIcon } from 'lucide-react-native';

import { MAX_RECORDINGS, RECOMMENDED_RECORDINGS } from '@/config';
import { type EditorRecording, RecordingItem } from '@/screens/words/components/recordings-section/recording-item';
import { colors, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';

interface Props {
	recordings: EditorRecording[];
	recordingMissing: boolean;
	saving: boolean;
	wordName: string;
	player: SoundPlayer;
	onAdd(): void;
	onDelete: (recording: EditorRecording, name: string) => void;
}

export function RecordingsSection({ recordings, recordingMissing, saving, wordName, player, onAdd, onDelete }: Props) {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const keptServerRecordingCount = recordings.filter((recording) => recording.kind === 'server').length;

	return (
		<View style={ui.section}>
			{/*제목과 도움말 버튼*/}
			<View style={styles.header}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('words.editor.recordings', { count: recordings.length })}
				</Copy>
				<IconButton
					icon={CircleQuestionMarkIcon}
					label={t('words.editor.guide')}
					variant="muted"
					onPress={() => navigation.navigate('RecordingGuide', { source: 'help', wordName })}
				/>
			</View>

			{/*녹음 목록*/}
			{recordings.map((recording, index) => {
				const deletable = !saving && !(recording.kind === 'server' && keptServerRecordingCount <= 1);

				return (
					<RecordingItem
						key={recording.id}
						item={recording}
						player={player}
						index={index}
						onDelete={deletable ? (name) => onDelete(recording, name) : undefined}
					/>
				);
			})}

			{/*오류 안내*/}
			<InlineError message={player.failedId ? t('common.sound.playError') : null} />
			<InlineError message={recordingMissing ? t('words.editor.recordingRequired') : null} />

			{/*녹음 추가 버튼과 권장 개수 안내*/}
			{recordings.length < MAX_RECORDINGS ? (
				<Button
					label={t('words.editor.addRecording')}
					icon={MicIcon}
					variant="secondary"
					disabled={saving}
					onPress={onAdd}
					style={styles.add}
				/>
			) : null}
			{recordings.length < RECOMMENDED_RECORDINGS ? (
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
