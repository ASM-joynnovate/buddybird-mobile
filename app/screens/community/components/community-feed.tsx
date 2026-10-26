import { ActivityIndicator, StyleSheet } from 'react-native';

import { usePrefetchQuery, useQueryClient } from '@tanstack/react-query';

import type { FeedItem } from '@/types/apis/feed';

import { useGetFeedItemList } from '@/hooks/apis/feed';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';
import { getLeaderboardOptions } from '@/hooks/apis/leaderboard';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';
import useSoundPlayer from '@/hooks/use-sound-player';

import Animated from 'react-native-reanimated';

import LeaderboardCard from '@/screens/community/components/leaderboard-card';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
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
import FeedCard, { feedCardKinds } from '@/components/feed-card';
import PullToRefreshContainer from '@/components/pull-to-refresh-container';

/** 순위 카드 및 피드 목록 컴포넌트 */
const CommunityFeed = () => {
	const queryClient = useQueryClient();

	const country = useSelectedCountry();

	usePrefetchQuery(getLeaderboardOptions({ country }));

	const { data: feedData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFeedItemList({ country });

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const player = useSoundPlayer();
	const lowPerformance = useIsLowPerformance();

	const { pullToRefresh, scrollProps } = usePullToRefresh<Animated.FlatList<FeedItem>>({
		onRefresh: () => {
			setPullToRefreshUsed(true);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: leaderboardKeys.detail(country) }),
				queryClient.invalidateQueries({ queryKey: feedKeys.list(country) }),
			]);
		},
		holdHeight: BUDDY_REFRESH_HEIGHT,
		minRefreshMs: BUDDY_REFRESH_MIN_MS,
		finishMs: BUDDY_REFRESH_FINISH_MS,
	});

	const feedItems = feedData.pages
		.flatMap((feedPage) => feedPage.data)
		.filter((feedItem) => Object.hasOwn(feedCardKinds, feedItem.kind));

	const handleFetchNextPage = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<PullToRefreshContainer
			pullToRefresh={pullToRefresh}
			indicatorComponents={
				lowPerformance
					? [BuddyRefreshThrobberIndicator]
					: [BuddyRefreshSwingIndicator, BuddyRefreshRopeIndicator]
			}
		>
			<Animated.FlatList
				{...scrollProps}
				data={feedItems}
				keyExtractor={(feedItem) => feedItem.id}
				renderItem={({ item: feedItem }) => <FeedCard feedItem={feedItem} player={player} />}
				ListHeaderComponent=<LeaderboardCard />
				onEndReachedThreshold={0.4}
				onEndReached={handleFetchNextPage}
				ListFooterComponent={
					isFetchingNextPage ? <ActivityIndicator color={colors.subtle} style={styles.footerLoading} /> : null
				}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
			/>
		</PullToRefreshContainer>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
	footerLoading: { paddingTop: 8 },
});

export default CommunityFeed;
