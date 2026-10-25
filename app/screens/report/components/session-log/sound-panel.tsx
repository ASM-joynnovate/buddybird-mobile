import { StyleSheet, View } from 'react-native';

import { useGetSessionSoundDurationQuery } from '@/hooks/apis/sessions';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { PauseIcon, PlayIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import SessionLogShareButton from '@/screens/report/components/session-log/share-button';
import type { LogItem } from '@/screens/report/utils/session-log';
import { track } from '@/services/telemetry/client';
import { colors } from '@/theme';

import SessionLogSoundTrack from '@/components/session/session-log-sound-track';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const PLAY_SIZE = 36;

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

	const { data: soundDurationData } = useGetSessionSoundDurationQuery(
		{ id: item.id, url: item.sounds.at(0)?.audio_file.url ?? '' },
		{ enabled: item.kind !== 'distressCall' && item.durationMs === null && item.sounds.length > 0 },
	);

	const { playingId, progress, play, stop } = useSoundPlayer();

	const accent = item.kind === 'distressCall' ? colors.error : colors.orange;
	const playing = playingId === item.id;
	const soundMissing = item.sounds.length === 0;
	const durationMs = item.durationMs ?? soundDurationData ?? null;
	const PlayStateIcon = playing ? PauseIcon : PlayIcon;
	let durationText: string | null = null;

	if (durationMs !== null) {
		durationText = t('common.duration.seconds', {
			value: item.kind === 'distressCall' ? Math.round(durationMs / SECOND) : (durationMs / SECOND).toFixed(1),
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

	return (
		<View style={styles.panel}>
			<View style={styles.player}>
				<SessionLogSoundTrack accent={accent} progress={playing ? progress : 0} durationText={durationText} />

				<PressableSurface
					accessibilityLabel={playing ? t('common.sound.stopNamed', { name: itemName }) : itemName}
					disabled={soundMissing}
					onPress={handleTogglePlay}
					depth="none"
					cornerRadius="pill"
					faceColor={soundMissing ? colors.disabledBackground : accent}
					edgeColor={soundMissing ? colors.disabledBackground : accent}
					style={styles.play}
					contentStyle={styles.playFace}
				>
					<PlayStateIcon
						size={13}
						color={soundMissing ? colors.subtle : colors.onFilled}
						fill={soundMissing ? colors.subtle : colors.onFilled}
					/>
				</PressableSurface>
			</View>

			<SessionLogShareButton item={item} itemName={itemName} sessionId={sessionId} />
		</View>
	);
};

const styles = StyleSheet.create({
	panel: { paddingBottom: 18 },
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	play: { width: PLAY_SIZE, height: PLAY_SIZE },
	playFace: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
});

export default SessionLogSoundPanel;
