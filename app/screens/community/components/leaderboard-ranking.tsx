import { StyleSheet, View } from 'react-native';

import { useGetLeaderboard } from '@/hooks/apis/leaderboard';
import { useGetMe } from '@/hooks/apis/users';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';

import Animated from 'react-native-reanimated';

import LeaderboardLane from '@/screens/community/components/leaderboard-lane';
import LeaderboardMyLane from '@/screens/community/components/leaderboard-my-lane';
import UnrankedNotice from '@/screens/community/components/unranked-notice';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
import { leaderboardTopScore } from '@/screens/community/utils/leaderboard';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/components/buddy-refresh/constants';
import BuddyRefreshRopeIndicator from '@/components/buddy-refresh/rope-indicator';
import BuddyRefreshSwingIndicator from '@/components/buddy-refresh/swing-indicator';
import BuddyRefreshThrobberIndicator from '@/components/buddy-refresh/throbber-indicator';
import PullToRefreshContainer from '@/components/pull-to-refresh-container';

/** 전체 순위 목록 컴포넌트 */
const LeaderboardRanking = () => {
	const { data: meData } = useGetMe();

	const country = useSelectedCountry();

	const { data: leaderboardData, refetch } = useGetLeaderboard({ country });

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const lowPerformance = useIsLowPerformance();

	const { pullToRefresh, scrollProps } = usePullToRefresh<Animated.ScrollView>({
		onRefresh: () => {
			setPullToRefreshUsed(true);

			return refetch();
		},
		holdHeight: BUDDY_REFRESH_HEIGHT,
		minRefreshMs: BUDDY_REFRESH_MIN_MS,
		finishMs: BUDDY_REFRESH_FINISH_MS,
	});

	const myRank = leaderboardData.me.rank;
	const topScore = leaderboardTopScore(leaderboardData);

	return (
		<>
			<PullToRefreshContainer
				pullToRefresh={pullToRefresh}
				indicatorComponents={
					lowPerformance
						? [BuddyRefreshThrobberIndicator]
						: [BuddyRefreshSwingIndicator, BuddyRefreshRopeIndicator]
				}
			>
				<Animated.ScrollView
					{...scrollProps}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
				>
					{leaderboardData.items.map((rankEntry) => (
						<LeaderboardLane
							key={rankEntry.user.id}
							rank={rankEntry.rank}
							score={rankEntry.score}
							topScore={topScore}
							nickname={rankEntry.user.nickname}
							photoUrl={rankEntry.user.photo_file?.url ?? null}
							country={rankEntry.user.country}
							isMe={rankEntry.user.id === meData.id}
						/>
					))}
				</Animated.ScrollView>
			</PullToRefreshContainer>

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
