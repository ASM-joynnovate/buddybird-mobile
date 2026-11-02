import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/i18n/format';

import { leaderboardScoreText } from '@/screens/community/utils/leaderboard';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import MascotArtwork from '@/components/mascot/artwork';
import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { Flag } from '@/components/ui/flag';

interface Props {
	rank: number;
	score: number;
	nickname: string | null;
	photoUrl: string | null;
	country: string | null;
	isMe: boolean;
}

/**
 * 순위 항목 컴포넌트
 * @param rank 순위
 * @param score 학습 시간 밀리초
 * @param nickname 닉네임
 * @param photoUrl 사용자 사진 주소
 * @param country 국가 코드
 * @param isMe 내 순위인지 여부
 */
const LeaderboardRankRow = ({ rank, score, nickname, photoUrl, country, isMe }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const rankText = formatNumber(rank, locale);
	const scoreText = leaderboardScoreText(score, locale);

	return (
		<View
			accessible
			accessibilityLabel={joinLabel(rankText, nickname, scoreText)}
			style={[styles.container, isMe && styles.containerMine]}
		>
			<Copy style={[styles.rank, isMe && styles.rankMine]}>{rankText}</Copy>
			<Avatar uri={photoUrl} placeholder=<MascotArtwork /> size="xsmall" />

			<View style={styles.nameRow}>
				<Copy numberOfLines={1} style={styles.nickname}>
					{nickname}
				</Copy>
				{isMe ? <Copy style={styles.me}>{t('community.me')}</Copy> : <Flag country={country} size="small" />}
			</View>

			<Copy style={styles.score}>{scoreText}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
	containerMine: { borderRadius: radius.tile, borderCurve: 'continuous', backgroundColor: colors.surface },
	rank: { fontFamily: font.black, fontSize: 15, color: colors.subtle, fontVariant: ['tabular-nums'] },
	rankMine: { color: colors.orangeDark },
	nameRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
	nickname: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 14 },
	me: { fontFamily: font.extraBold, fontSize: 12, color: colors.orangeDark },
	score: { fontFamily: font.black, fontSize: 14, fontVariant: ['tabular-nums'] },
});

export default LeaderboardRankRow;
