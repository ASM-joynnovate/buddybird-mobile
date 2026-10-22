import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import { Copy } from '@/components/ui/copy';

const PERCENT = 100;

interface Props {
	accent: string;
	progress: number;
	durationText: string | null;
}

/**
 * 오디오 재생 위치 표시 컴포넌트
 * @param accent 재생한 부분의 색
 * @param progress 재생 위치 비율
 * @param durationText 오디오 길이 문구
 */
const SessionLogSoundTrack = ({ accent, progress, durationText }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.track}>
			<View style={styles.wave}>
				<View style={[styles.waveFill, { width: `${progress * PERCENT}%`, backgroundColor: accent }]} />
			</View>
			<View style={styles.ends}>
				<Copy style={styles.end}>{t('common.duration.seconds', { value: 0 })}</Copy>
				{durationText !== null && <Copy style={styles.end}>{durationText}</Copy>}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
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
});

export default SessionLogSoundTrack;
