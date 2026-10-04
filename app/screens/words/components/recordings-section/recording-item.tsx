import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { getRecordingDurationOptions } from '@/hooks/apis/words';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { TrashIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';
import { Surface } from '@/components/ui/surface';

export interface EditorRecording {
	kind: 'server' | 'local';
	id: string;
	url: string;
	pending: boolean;
	durationMs: number | null;
	waveformLevels: number[] | null;
}

export interface NewRecording {
	key: string;
	uri: string;
	durationMs: number;
	waveformLevels: number[];
	replacedRecordingId: string | null;
	recordingId: string | null;
}

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
 * @param player useSoundPlayer 결과
 * @param index 녹음 목록 안의 순서
 * @param uploading 서버에 올리는 중인 녹음인지 여부
 * @param onDelete 삭제 버튼을 누를 때 실행할 함수
 */
const RecordingItem = ({ recording, player, index, uploading, onDelete }: Props) => {
	const { t } = useTranslation();

	const { data: recordingDurationData } = useQuery({
		...getRecordingDurationOptions({ id: recording.id, url: recording.url }),
		enabled: recording.kind === 'server',
		throwOnError: false,
	});

	const name = t('words.editor.recordingName', { index: index + 1 });
	const playing = player.playingId === recording.id;
	const durationMs = recording.durationMs ?? recordingDurationData ?? null;

	return (
		<View style={[styles.container, index > 0 && styles.divider, playing && styles.playingContainer]}>
			<View style={styles.textContainer}>
				<Copy style={[styles.name, playing && styles.playingName]}>{name}</Copy>
				{durationMs !== null && (
					<Copy style={styles.duration}>
						{t('common.duration.seconds', { value: (durationMs / SECOND).toFixed(2) })}
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
			{playing && <View style={[styles.progress, { width: `${player.progress * 100}%` }]} />}
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

export default RecordingItem;
