import { useState } from 'react';

import { ActivityIndicator, StyleSheet, View, type ViewToken } from 'react-native';

import { usePrefetchQuery, useQueryClient } from '@tanstack/react-query';

import type { FeedListItem } from '@/types/apis/feed';

import { useGetFeedItemList } from '@/hooks/apis/feed';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';
import { getLeaderboardOptions } from '@/hooks/apis/leaderboard';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import Animated from 'react-native-reanimated';

import FeedAdCard from '@/screens/community/components/feed-ad-card';
import LeaderboardCard from '@/screens/community/components/leaderboard-card';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
import { useAdStore } from '@/stores/ad';
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
import FeedCard from '@/components/feed-card';
import PullToRefreshContainer from '@/components/pull-to-refresh-container';
import { EmptyState } from '@/components/ui/empty-state';

interface PositionedFeedItem {
	feedItem: FeedListItem;
	position: number;
}

interface ViewableItemsChangedInfo {
	changed: ViewToken<PositionedFeedItem>[];
}

/** 순위 카드 및 피드 목록 컴포넌트 */
const CommunityFeed = () => {
	const { t } = useTranslation();

	const queryClient = useQueryClient();

	const [failedAdServeIds, setFailedAdServeIds] = useState<string[]>([]);

	const country = useSelectedCountry();

	usePrefetchQuery(getLeaderboardOptions({ country }));

	const { data: feedData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFeedItemList({ country });

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);
	const addAdImpression = useAdStore((state) => state.addAdImpression);

	const player = useSoundPlayer();
	const lowPerformance = useIsLowPerformance();

	const { pullToRefresh, scrollProps } = usePullToRefresh<Animated.FlatList<PositionedFeedItem>>({
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

	const positionedFeedItems = feedData.pages
		.flatMap((feedPage) => feedPage.data.map((feedItem, position) => ({ feedItem, position })))
		.filter(({ feedItem }) => feedItem.kind !== 'ad' || !failedAdServeIds.includes(feedItem.serve_id));

	const handleFetchNextPage = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

	/** 화면에 표시된 광고 카드 노출 기록 */
	const handleViewableItemsChanged = ({ changed }: ViewableItemsChangedInfo) => {
		for (const { item, isViewable } of changed) {
			if (isViewable && item.feedItem.kind === 'ad') {
				addAdImpression(item.feedItem, item.position);
			}
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
				data={positionedFeedItems}
				keyExtractor={({ feedItem }) => (feedItem.kind === 'ad' ? feedItem.serve_id : feedItem.id)}
				renderItem={({ item: { feedItem, position } }) =>
					feedItem.kind === 'ad' ? (
						<FeedAdCard
							feedAdItem={feedItem}
							position={position}
							onImageError={() => setFailedAdServeIds((prev) => [...prev, feedItem.serve_id])}
						/>
					) : (
						<FeedCard feedItem={feedItem} player={player} />
					)
				}
				onViewableItemsChanged={handleViewableItemsChanged}
				ListHeaderComponent={
					<>
						<LeaderboardCard />
						<View style={styles.divider} />
					</>
				}
				ListEmptyComponent=<EmptyState message={t('community.feed.empty')} />
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
	list: { flexGrow: 1, gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
	divider: { height: 2, marginTop: 20, marginBottom: 8, marginHorizontal: -16, backgroundColor: colors.border },
	footerLoading: { paddingTop: 8 },
});

export default CommunityFeed;
