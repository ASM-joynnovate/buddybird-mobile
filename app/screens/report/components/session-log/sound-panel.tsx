import { StyleSheet, View } from 'react-native';

import { useGetSessionSoundDurationQuery } from '@/hooks/apis/sessions';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { PauseIcon, PlayIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import type { LogItem } from '@/screens/report/utils/session-log';
import { track } from '@/services/telemetry/client';
import { colors } from '@/theme';

import SessionLogSoundTrack from '@/components/session/session-log-sound-track';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const PLAY_SIZE = 36;

interface Props {
	logItem: LogItem;
	itemLabel: string;
	sessionId: string;
}

/**
 * 펼친 행의 오디오 재생 컴포넌트
 * @param logItem 기록
 * @param itemLabel 기록 이름
 * @param sessionId 세션 ID
 */
const SessionLogSoundPanel = ({ logItem, itemLabel, sessionId }: Props) => {
	const { t } = useTranslation();

	const { data: soundDurationData } = useGetSessionSoundDurationQuery(
		{ id: logItem.id, url: logItem.sounds.at(0)?.audio_file.url ?? '' },
		{ enabled: logItem.kind !== 'distressCall' && logItem.durationMs === null && logItem.sounds.length > 0 },
	);

	const { playingId, progress, play, stop } = useSoundPlayer();

	const accent = logItem.kind === 'distressCall' ? colors.error : colors.orange;
	const playing = playingId === logItem.id;
	const soundMissing = logItem.sounds.length === 0;
	const durationMs = logItem.durationMs ?? soundDurationData ?? null;
	const PlayStateIcon = playing ? PauseIcon : PlayIcon;
	let durationText: string | null = null;

	if (durationMs !== null) {
		const fractionDigits = logItem.kind === 'distressCall' ? 0 : 1;

		durationText = t('common.duration.seconds', {
			value: durationMs / SECOND,
			formatParams: { value: { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits } },
		});
	}

	const handleTogglePlay = () => {
		if (playing) {
			stop();

			return;
		}

		track('parrot_sound_played', { session_id: sessionId });

		play(logItem.id, ...logItem.sounds.map((sound) => sound.audio_file.url));
	};

	return (
		<View style={styles.player}>
			<SessionLogSoundTrack accent={accent} progress={playing ? progress : 0} durationText={durationText} />

			<PressableSurface
				accessibilityLabel={playing ? t('common.sound.stopNamed', { name: itemLabel }) : itemLabel}
				disabled={soundMissing}
				onPress={handleTogglePlay}
				depth="none"
				cornerRadius="pill"
				faceColor={soundMissing ? colors.disabledBackground : accent}
				edgeColor={soundMissing ? colors.disabledBackground : accent}
				style={styles.playButton}
				contentStyle={styles.playFace}
			>
				<PlayStateIcon
					size={13}
					color={soundMissing ? colors.subtle : colors.onFilled}
					fill={soundMissing ? colors.subtle : colors.onFilled}
				/>
			</PressableSurface>
		</View>
	);
};

const styles = StyleSheet.create({
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	playButton: { width: PLAY_SIZE, height: PLAY_SIZE },
	playFace: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
});

export default SessionLogSoundPanel;
