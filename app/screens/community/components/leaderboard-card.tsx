import { StyleSheet, View } from 'react-native';

import type { CommunityStackParamList } from '@/types/navigation';

import { useGetLeaderboard } from '@/hooks/apis/leaderboard';
import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { formatMonth } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { ChevronRightIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { LEADERBOARD_PODIUM_RANK_COUNT } from '@/config/policy';
import LeaderboardMyRank from '@/screens/community/components/leaderboard-my-rank';
import LeaderboardPodium from '@/screens/community/components/leaderboard-podium';
import UnrankedNotice from '@/screens/community/components/unranked-notice';
import { leaderboardMonthStart } from '@/screens/community/utils/leaderboard';
import { colors, font, radius } from '@/theme';

import { riseIn } from '@/components/burst-animations';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const MY_RANK_DELAY_MS = 1100;

/** 이번 달 순위 카드 컴포넌트 */
const LeaderboardCard = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();

	const { data: meData } = useGetMe();

	const { data: leaderboardData } = useGetLeaderboard({ period: 'monthly', start: leaderboardMonthStart() });

	const myRank = leaderboardData.me.rank;
	const viewAllLabel = t('community.leaderboard.viewAll');

	return (
		<View style={styles.card}>
			<View style={styles.titleRow}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('community.leaderboard.title', { month: formatMonth(dayjs.utc()) })}
				</Copy>

				<PressableSurface
					accessibilityLabel={viewAllLabel}
					onPress={() => navigation.navigate('Leaderboard')}
					variant="plain"
					depth="none"
					cornerRadius="small"
					contentStyle={styles.viewAllButton}
				>
					<Copy style={styles.viewAllLabel}>{viewAllLabel}</Copy>
					<ChevronRightIcon size={16} color={colors.orangeDark} />
				</PressableSurface>
			</View>

			<LeaderboardPodium rankEntries={leaderboardData.items} myUserId={meData.id} />

			{myRank !== null && myRank > LEADERBOARD_PODIUM_RANK_COUNT && (
				<Animated.View entering={riseIn().delay(MY_RANK_DELAY_MS)}>
					<LeaderboardMyRank rank={myRank} score={leaderboardData.me.score} />
				</Animated.View>
			)}

			{myRank === null && (
				<Animated.View entering={riseIn().delay(MY_RANK_DELAY_MS)}>
					<UnrankedNotice reason={leaderboardData.me.unranked_reason} />
				</Animated.View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		gap: 16,
		padding: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
	title: { flex: 1, minWidth: 0, fontFamily: font.black, fontSize: 17, lineHeight: 22 },
	viewAllButton: {
		minHeight: 32,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
		marginRight: -4,
		paddingHorizontal: 4,
		borderWidth: 0,
	},
	viewAllLabel: { fontFamily: font.extraBold, fontSize: 14, color: colors.orangeDark },
});

export default LeaderboardCard;
