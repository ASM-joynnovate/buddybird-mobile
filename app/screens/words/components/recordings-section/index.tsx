import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CircleQuestionMarkIcon, MicIcon } from 'lucide-react-native';

import { MAX_RECORDINGS, RECOMMENDED_RECORDINGS } from '@/config';
import RecordingItem, { type EditorRecording } from '@/screens/words/components/recordings-section/recording-item';
import { colors, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { ui } from '@/components/ui/styles';

interface Props {
	recordings: EditorRecording[];
	recordingMissing: boolean;
	saving: boolean;
	player: SoundPlayer;
	onAdd: () => void;
	onDelete: (recording: EditorRecording, name: string) => void;
}

/**
 * 녹음 목록 컴포넌트
 * @param recordings 편집 중인 단어의 녹음 목록
 * @param recordingMissing 녹음 없이 저장을 눌렀는지 여부
 * @param saving 단어 저장 중 여부
 * @param player useSoundPlayer 결과
 * @param onAdd 녹음 추가 버튼을 누를 때 실행할 함수
 * @param onDelete 녹음 삭제 버튼을 누를 때 실행할 함수
 */
const RecordingsSection = ({ recordings, recordingMissing, saving, player, onAdd, onDelete }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const uploadedRecordingCount = recordings.filter(
		(recording) => recording.kind === 'server' && !recording.pending,
	).length;

	return (
		<View style={ui.sectionContainer}>
			{/*헤더*/}
			<View style={styles.headerRow}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('words.editor.recordings', { count: recordings.length })}
				</Copy>
				<IconButton
					icon={CircleQuestionMarkIcon}
					label={t('words.editor.openGuide')}
					variant="muted"
					onPress={() => navigation.navigate('RecordingGuide')}
				/>
			</View>
			{recordings.length < RECOMMENDED_RECORDINGS && (
				<Copy style={styles.hint}>{t('words.editor.recordingsHint')}</Copy>
			)}

			{recordings.length > 0 && (
				<ItemGroup>
					{recordings.map((recording, index) => {
						const deletable =
							!saving &&
							!recording.pending &&
							!(recording.kind === 'server' && uploadedRecordingCount <= 1);

						return (
							<RecordingItem
								key={recording.id}
								recording={recording}
								player={player}
								index={index}
								uploading={(saving && recording.kind === 'local') || recording.pending}
								onDelete={deletable ? (name) => onDelete(recording, name) : undefined}
							/>
						);
					})}
				</ItemGroup>
			)}

			<InlineError message={player.failedId ? t('common.sound.playError') : null} />
			<InlineError message={recordingMissing ? t('words.editor.recordingRequired') : null} />

			{recordings.length < MAX_RECORDINGS && (
				<Button
					label={t('words.editor.addRecording')}
					icon={MicIcon}
					variant="secondary"
					size="small"
					disabled={saving}
					onPress={onAdd}
					style={styles.add}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
	title: { flex: 1, fontSize: 18, lineHeight: 24, fontFamily: font.black },
	hint: { color: colors.muted, marginBottom: 12 },
	add: { marginTop: 12 },
});

export default RecordingsSection;
