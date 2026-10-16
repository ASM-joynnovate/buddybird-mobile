import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { getSessionSoundDurationOptions, useShareSessionFile, useShareSessionJoinedSound } from '@/hooks/apis/sessions';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { PauseIcon, PlayIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import { sessionDetailColors, logItemColors } from '@/screens/report/components/session-detail-colors';
import SessionLogShareButton from '@/screens/report/components/session-log/share-button';
import { track } from '@/services/telemetry/client';
import { useMessageStore } from '@/stores/message';
import { colors, font } from '@/theme';
import type { LogItem } from '@/utils/session-log';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const SHARED_FILE_TIME_FORMAT = 'YYYYMMDD-HHmmss';
const PLAY_SIZE = 36;
const PERCENT = 100;

interface Props {
	item: LogItem;
	itemName: string;
	sessionId: string;
}

/**
 * 펼친 행의 오디오 재생 컴포넌트
 * @param item 기록
 * @param itemName 기록 이름
 * @param sessionId 세션 ID
 */
const SessionLogSoundPanel = ({ item, itemName, sessionId }: Props) => {
	const { t } = useTranslation();

	const { data: soundDurationData } = useQuery({
		...getSessionSoundDurationOptions({ id: item.id, url: item.sounds.at(0)?.audio_file.url ?? '' }),
		enabled: item.kind !== 'emergency' && item.durationMs === null && item.sounds.length > 0,
		throwOnError: false,
	});
	const { isPending: fileSharing, mutate: shareFile } = useShareSessionFile();
	const { isPending: joinedSoundSharing, mutate: shareJoinedSound } = useShareSessionJoinedSound();

	const { playingId, progress, play, stop } = useSoundPlayer();

	const openPopup = useMessageStore((state) => state.openPopup);

	const palette = logItemColors[item.kind];
	const playing = playingId === item.id;
	const soundless = item.sounds.length === 0;
	const durationMs = item.durationMs ?? soundDurationData ?? null;
	const PlayStateIcon = playing ? PauseIcon : PlayIcon;
	let durationText: string | null = null;

	if (durationMs !== null) {
		durationText = t('common.duration.seconds', {
			value: item.kind === 'emergency' ? Math.round(durationMs / SECOND) : (durationMs / SECOND).toFixed(1),
		});
	}

	const handleTogglePlay = () => {
		if (playing) {
			stop();

			return;
		}

		track('parrot_sound_played', { session_id: sessionId });

		play(item.id, ...item.sounds.map((sound) => sound.audio_file.url));
	};

	const handleShare = () => {
		if (fileSharing || joinedSoundSharing) {
			return;
		}

		const fileName = `buddybird-${dayjs(item.startedAt).format(SHARED_FILE_TIME_FORMAT)}`;
		const callbacks = {
			onSuccess: () => track('parrot_sound_shared', { session_id: sessionId }),
			onError: () => openPopup({ title: t('report.detail.shareError') }),
		};

		if (item.kind === 'emergency') {
			shareJoinedSound({ urls: item.sounds.map((sound) => sound.audio_file.url), fileName }, callbacks);
		} else {
			shareFile({ url: item.sounds[0].audio_file.url, fileName, fileType: 'wav' }, callbacks);
		}
	};

	return (
		<View style={styles.panel}>
			<View style={styles.player}>
				<View style={styles.track}>
					<View style={styles.wave}>
						<View
							style={[
								styles.waveFill,
								{ width: `${(playing ? progress : 0) * PERCENT}%`, backgroundColor: palette.accent },
							]}
						/>
					</View>
					<View style={styles.ends}>
						<Copy style={styles.end}>{t('common.duration.seconds', { value: 0 })}</Copy>
						{durationText !== null && <Copy style={styles.end}>{durationText}</Copy>}
					</View>
				</View>

				<PressableSurface
					accessibilityLabel={playing ? t('common.sound.stopNamed', { name: itemName }) : itemName}
					disabled={soundless}
					onPress={handleTogglePlay}
					depth="none"
					cornerRadius="pill"
					faceColor={soundless ? colors.disabledBackground : palette.accent}
					edgeColor={soundless ? colors.disabledBackground : palette.accent}
					style={styles.play}
					contentStyle={styles.playFace}
				>
					<PlayStateIcon
						size={13}
						color={soundless ? colors.subtle : colors.onFilled}
						fill={soundless ? colors.subtle : colors.onFilled}
					/>
				</PressableSurface>
			</View>

			<SessionLogShareButton itemName={itemName} disabled={soundless} onPress={handleShare} />
		</View>
	);
};

const styles = StyleSheet.create({
	panel: { paddingBottom: 18 },
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	track: { flex: 1, minWidth: 0 },
	wave: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: sessionDetailColors.track },
	waveFill: { height: '100%', borderRadius: 3 },
	ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
	end: {
		fontFamily: font.medium,
		fontSize: 12,
		lineHeight: 16,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	play: { width: PLAY_SIZE, height: PLAY_SIZE },
	playFace: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
});

export default SessionLogSoundPanel;
