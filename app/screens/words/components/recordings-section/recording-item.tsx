import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { TrashIcon } from 'lucide-react-native';

import { measureAudioDuration } from '@/services/media/audio-duration';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PlayButton } from '@/components/ui/play-button';

export interface EditorRecording {
	kind: 'server' | 'local';
	id: string;
	url: string;
	durationMs: number | null;
}

interface Props {
	recording: EditorRecording;
	player: SoundPlayer;
	index: number;
	onDelete?: (name: string) => void;
}

/**
 * 녹음 이름과 길이, 삭제 버튼, 재생 버튼을 보여 주고 재생 버튼을 누르면 녹음을 재생하거나 멈추는 컴포넌트
 * @param recording 보여 줄 녹음
 * @param player 녹음을 재생하고 멈추는 useSoundPlayer 결과
 * @param index 녹음 목록 안의 순서
 * @param onDelete 삭제 버튼을 누를 때 실행할 함수, 삭제할 수 없으면 없음
 */
const RecordingItem = ({ recording, player, index, onDelete }: Props) => {
	const { t } = useTranslation();

	// oxlint-disable-next-line @tanstack/query/exhaustive-deps
	const { data: recordingDurationData } = useQuery({
		queryKey: apiKeys.recordings.duration(recording.id),
		queryFn: () =>
			measureAudioDuration(recording.url).catch((error: unknown) => {
				reportError(error, 'recording_duration');

				throw error;
			}),
		enabled: recording.kind === 'server',
		throwOnError: false,
		staleTime: Infinity,
	});

	const locale = useDeviceSettingsStore((state) => state.locale);

	const name = t('words.editor.recordingName', { index: index + 1 });
	const playing = player.playingId === recording.id;
	const durationMs = recording.durationMs ?? recordingDurationData ?? null;

	return (
		<View style={[styles.container, index > 0 && styles.divider]}>
			{/*녹음 이름과 길이*/}
			<View style={styles.textContainer}>
				<Copy style={styles.name}>{name}</Copy>
				<View style={styles.meta}>
					{durationMs !== null && <Copy style={styles.duration}>{formatDuration(durationMs, locale)}</Copy>}
					{recording.kind === 'local' && <Copy style={styles.unsaved}>{t('words.editor.unsaved')}</Copy>}
				</View>
			</View>

			{/*삭제와 재생 버튼*/}
			<IconButton
				icon={TrashIcon}
				label={t('words.editor.deleteRecording', { name })}
				variant="muted"
				disabled={!onDelete}
				onPress={() => onDelete?.(name)}
			/>
			<PlayButton
				playing={playing}
				label={t(playing ? 'common.sound.stopNamed' : 'words.editor.play', { name })}
				onPress={() => player.toggle(recording.id, recording.url)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10 },
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.extraBold, fontSize: 16 },
	meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	unsaved: { color: colors.orangeDark, fontFamily: font.extraBold, fontSize: 12.5 },
	duration: { color: colors.muted, fontSize: 13.5, fontVariant: ['tabular-nums'] },
});

export default RecordingItem;
