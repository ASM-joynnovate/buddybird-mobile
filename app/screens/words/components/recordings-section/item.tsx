import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { EditorRecording } from '@/types/recording';
import type { SoundPlayer } from '@/types/sound-player';

import { useTranslation } from 'react-i18next';

import { TrashIcon } from 'lucide-react-native';

import { PERCENT, SECOND } from '@/config/units';
import useRecordingDuration from '@/screens/words/hooks/use-recording-duration';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';
import { Surface } from '@/components/ui/surface';

interface Props {
	recording: EditorRecording;
	player: SoundPlayer;
	index: number;
	uploading: boolean;
	onDelete?: (name: string) => void;
}

/**
 * 녹음 항목 컴포넌트
 * @param recording 표시할 녹음
 * @param player 녹음 재생 상태 및 제어 함수
 * @param index 녹음 목록 안의 순서
 * @param uploading 서버에 올리는 중인 녹음인지 여부
 * @param onDelete 삭제 버튼을 누를 때 실행할 함수
 */
const RecordingsSectionItem = ({ recording, player, index, uploading, onDelete }: Props) => {
	const { t } = useTranslation();

	const { data: recordingDurationData } = useRecordingDuration(recording);

	const name = t('words.editor.recordingName', { index: index + 1 });
	const playing = player.playingId === recording.id;
	const durationMs = recording.durationMs ?? recordingDurationData ?? null;

	return (
		<View style={[styles.container, index > 0 && styles.divider, playing && styles.playingContainer]}>
			<View style={styles.textContainer}>
				<Copy style={[styles.name, playing && styles.playingName]}>{name}</Copy>
				{durationMs !== null && (
					<Copy style={styles.duration}>
						{t('common.duration.seconds', {
							value: durationMs / SECOND,
							formatParams: { value: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
						})}
					</Copy>
				)}
			</View>

			<IconButton
				icon={TrashIcon}
				label={t('words.editor.deleteRecording', { name })}
				variant="muted"
				disabled={!onDelete}
				onPress={() => onDelete?.(name)}
			/>
			{uploading ? (
				<Surface
					accessible
					accessibilityLabel={t('words.editor.uploading')}
					variant="primary"
					cornerRadius="pill"
					contentStyle={styles.uploadingFace}
				>
					<ActivityIndicator color={colors.onFilled} />
				</Surface>
			) : (
				<PlayButton
					playing={playing}
					label={t(playing ? 'common.sound.stopNamed' : 'words.editor.play', { name })}
					onPress={() => player.toggle(recording.id, recording.url)}
				/>
			)}

			{/*재생 위치*/}
			{playing && <View style={[styles.progress, { width: `${player.progress * PERCENT}%` }]} />}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingVertical: 10,
		paddingLeft: 16,
		paddingRight: 8,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	playingContainer: { backgroundColor: colors.orangePale },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.extraBold, fontSize: 16 },
	playingName: { color: colors.orangeDark },
	duration: { color: colors.muted, fontSize: 13.5, fontVariant: ['tabular-nums'] },
	uploadingFace: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
	progress: { position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: colors.orange },
});

export default RecordingsSectionItem;
