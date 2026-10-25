import { ScrollView, StyleSheet, View } from 'react-native';

import { useGetLeaderboard } from '@/hooks/apis/leaderboard';
import { useGetMe } from '@/hooks/apis/users';

import LeaderboardLane from '@/screens/community/components/leaderboard-lane';
import LeaderboardMyLane from '@/screens/community/components/leaderboard-my-lane';
import UnrankedNotice from '@/screens/community/components/unranked-notice';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
import { leaderboardTopScore } from '@/screens/community/utils/leaderboard';
import { colors } from '@/theme';

/** 전체 순위 목록 컴포넌트 */
const LeaderboardRanking = () => {
	const { data: meData } = useGetMe();

	const country = useSelectedCountry();

	const { data: leaderboardData } = useGetLeaderboard({ country });

	const myRank = leaderboardData.me.rank;
	const topScore = leaderboardTopScore(leaderboardData);

	return (
		<>
			<ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
				{leaderboardData.items.map((item) => (
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
			</ScrollView>

			{/*아래에 고정한 내 순위*/}
			<View style={styles.myRankContainer}>
				{myRank === null ? (
					<UnrankedNotice reason={leaderboardData.me.unranked_reason} />
				) : (
					<LeaderboardMyLane rank={myRank} score={leaderboardData.me.score} topScore={topScore} />
				)}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	list: { gap: 14, padding: 16 },
	myRankContainer: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderTopWidth: 2,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
});

export default LeaderboardRanking;
