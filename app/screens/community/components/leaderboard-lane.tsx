import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { CrownIcon, UserRoundIcon } from 'lucide-react-native';

import { HOUR } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { Flag } from '@/components/ui/flag';

const MIN_BAR_PERCENT = 8;
const MINUTES_HIDDEN_FROM_HOURS = 10;

interface Props {
	rank: number;
	score: number;
	topScore: number;
	nickname: string | null;
	photoUrl: string | null;
	country: string | null;
	userIsMe: boolean;
}

/**
 * 학습 시간 순위 막대 컴포넌트
 * @param rank 순위
 * @param score 이번 달 학습 시간 밀리초
 * @param topScore 1위의 학습 시간 밀리초
 * @param nickname 닉네임
 * @param photoUrl 사용자 사진 주소
 * @param country 국가 코드
 * @param userIsMe 내 순위인지 여부
 */
const LeaderboardLane = ({ rank, score, topScore, nickname, photoUrl, country, userIsMe }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const barPercent = Math.max(MIN_BAR_PERCENT, topScore > 0 ? (score / topScore) * 100 : 0);
	const scoreText = formatDuration(
		score >= MINUTES_HIDDEN_FROM_HOURS * HOUR ? Math.floor(score / HOUR) * HOUR : score,
		locale,
	);

	return (
		<View accessible accessibilityLabel={`${rank} ${nickname ?? ''} ${scoreText}`}>
			<View style={styles.topRow}>
				<Copy style={[styles.rank, userIsMe && styles.rankMine]}>{rank}</Copy>
				{rank === 1 && <CrownIcon size={16} color={colors.orange} style={styles.crown} />}

				<View style={styles.nameRow}>
					<Copy numberOfLines={1} style={styles.nickname}>
						{nickname}
					</Copy>
					{userIsMe ? (
						<Copy style={styles.me}>{t('community.me')}</Copy>
					) : (
						<Flag country={country} size="small" />
					)}
				</View>

				<Copy style={styles.score}>{scoreText}</Copy>
			</View>

			{/*학습 시간 막대*/}
			<View style={styles.track}>
				<View style={[styles.fill, userIsMe && styles.fillMine, { width: `${barPercent}%` }]} />
				<View style={[styles.avatarContainer, { left: `${barPercent}%` }]}>
					<Avatar uri={photoUrl} icon={UserRoundIcon} size="xsmall" />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	topRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
	rank: { width: 18, fontFamily: font.black, fontSize: 13, color: colors.subtle, fontVariant: ['tabular-nums'] },
	rankMine: { color: colors.orangeDark },
	crown: { marginRight: -2 },
	nameRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
	nickname: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13 },
	me: { fontFamily: font.extraBold, fontSize: 12, color: colors.orangeDark },
	score: { fontFamily: font.black, fontSize: 13, fontVariant: ['tabular-nums'] },
	track: {
		height: 16,
		marginTop: 8,
		marginRight: 16,
		marginBottom: 6,
		marginLeft: 24,
		borderRadius: 8,
		backgroundColor: colors.surface,
	},
	fill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 8, backgroundColor: colors.green },
	fillMine: { backgroundColor: colors.orange },
	avatarContainer: {
		position: 'absolute',
		top: -11,
		marginLeft: -19,
		padding: 3,
		borderRadius: 19,
		backgroundColor: colors.background,
	},
});

export default LeaderboardLane;
