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

import LeaderboardLane from '@/screens/community/components/leaderboard-lane';
import LeaderboardMyLane from '@/screens/community/components/leaderboard-my-lane';
import UnrankedNotice from '@/screens/community/components/unranked-notice';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
import { leaderboardTopScore } from '@/screens/community/utils/leaderboard';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const TOP_RANK_COUNT = 5;

/** 이번 달 순위 카드 컴포넌트 */
const LeaderboardCard = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();

	const { data: meData } = useGetMe();

	const country = useSelectedCountry();

	const { data: leaderboardData } = useGetLeaderboard({ country });

	const myRank = leaderboardData.me.rank;
	const topScore = leaderboardTopScore(leaderboardData);
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

			{leaderboardData.items.length > 0 && (
				<View style={styles.laneContainer}>
					{leaderboardData.items.slice(0, TOP_RANK_COUNT).map((item) => (
						<LeaderboardLane
							key={item.user.id}
							rank={item.rank}
							score={item.score}
							topScore={topScore}
							nickname={item.user.nickname}
							photoUrl={item.user.photo_file?.url ?? null}
							country={item.user.country}
							userIsMe={item.user.id === meData.id}
						/>
					))}

					{myRank !== null && myRank > TOP_RANK_COUNT && (
						<>
							{myRank > TOP_RANK_COUNT + 1 && (
								<View style={styles.gapDotRow}>
									<View style={styles.gapDot} />
									<View style={styles.gapDot} />
									<View style={styles.gapDot} />
								</View>
							)}
							<LeaderboardMyLane rank={myRank} score={leaderboardData.me.score} topScore={topScore} />
						</>
					)}
				</View>
			)}

			{myRank === null && (
				<UnrankedNotice reason={leaderboardData.me.unranked_reason} style={styles.unrankedNotice} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 14,
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
	laneContainer: { gap: 10, marginTop: 16 },
	gapDotRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginVertical: 2 },
	gapDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },
	unrankedNotice: { marginTop: 14 },
});

export default LeaderboardCard;
