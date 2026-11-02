import { Fragment } from 'react';

import { StyleSheet, View } from 'react-native';

import type { LeaderboardPeriod } from '@/types/apis/leaderboard';

import { useGetLeaderboard } from '@/hooks/apis/leaderboard';
import { useGetMe } from '@/hooks/apis/users';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';

import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/i18n/format';

import Animated from 'react-native-reanimated';

import { LEADERBOARD_PODIUM_RANK_COUNT, LEADERBOARD_RANK_LIMIT } from '@/config/policy';
import LeaderboardMyRank from '@/screens/community/components/leaderboard-my-rank';
import LeaderboardPodium from '@/screens/community/components/leaderboard-podium';
import LeaderboardRankRow from '@/screens/community/components/leaderboard-rank-row';
import UnrankedNotice from '@/screens/community/components/unranked-notice';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/components/buddy-refresh/constants';
import BuddyRefreshRopeIndicator from '@/components/buddy-refresh/rope-indicator';
import BuddyRefreshSwingIndicator from '@/components/buddy-refresh/swing-indicator';
import BuddyRefreshThrobberIndicator from '@/components/buddy-refresh/throbber-indicator';
import PullToRefreshContainer from '@/components/pull-to-refresh-container';
import { Copy } from '@/components/ui/copy';

interface Props {
	period: LeaderboardPeriod;
	start: string | null;
}

/**
 * 기간별 전체 순위 컴포넌트
 * @param period 순위 기간
 * @param start 월별 순위의 달 1일 날짜
 */
const LeaderboardRanking = ({ period, start }: Props) => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();
	const { data: leaderboardData, refetch } = useGetLeaderboard({ period, start });

	const locale = useDeviceSettingsStore((state) => state.locale);

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
	const listedRankEntries = leaderboardData.items.slice(LEADERBOARD_PODIUM_RANK_COUNT);

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
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					<LeaderboardPodium rankEntries={leaderboardData.items} myUserId={meData.id} />

					{listedRankEntries.length > 0 && (
						<>
							<View style={styles.list}>
								{listedRankEntries.map((rankEntry, index) => (
									<Fragment key={rankEntry.user.id}>
										{index > 0 && <View style={styles.separator} />}
										<LeaderboardRankRow
											rank={rankEntry.rank}
											score={rankEntry.score}
											nickname={rankEntry.user.nickname}
											photoUrl={rankEntry.user.photo_file?.url ?? null}
											country={rankEntry.user.country}
											isMe={rankEntry.user.id === meData.id}
										/>
									</Fragment>
								))}
							</View>
							<Copy style={styles.rankLimit}>
								{t('community.leaderboard.rankLimit', {
									rank: formatNumber(LEADERBOARD_RANK_LIMIT, locale),
								})}
							</Copy>
						</>
					)}
				</Animated.ScrollView>
			</PullToRefreshContainer>

			{/*아래에 고정한 내 순위*/}
			<View style={styles.myRankContainer}>
				{myRank === null ? (
					<UnrankedNotice reason={leaderboardData.me.unranked_reason} />
				) : (
					<LeaderboardMyRank rank={myRank} score={leaderboardData.me.score} />
				)}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	content: { padding: 16 },
	list: { marginTop: 16 },
	separator: { height: 2, backgroundColor: colors.surface },
	rankLimit: { paddingTop: 20, textAlign: 'center', fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	myRankContainer: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderTopWidth: 2,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
});

export default LeaderboardRanking;
