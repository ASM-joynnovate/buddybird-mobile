import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { useGetFeedItemList } from '@/hooks/apis/feed';
import { getLeaderboardOptions } from '@/hooks/apis/leaderboard';
import useSoundPlayer from '@/hooks/use-sound-player';

import FeedCard, { feedCardKinds } from '@/screens/community/components/feed-card';
import LeaderboardCard from '@/screens/community/components/leaderboard-card';
import useSelectedCountry from '@/screens/community/hooks/use-selected-country';
import { colors } from '@/theme';

/** 순위 카드 및 피드 목록 컴포넌트 */
const CommunityFeed = () => {
	const country = useSelectedCountry();

	usePrefetchQuery(getLeaderboardOptions({ country }));

	const { data: feedData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFeedItemList({ country });

	const player = useSoundPlayer();

	const feedItems = feedData.pages
		.flatMap((feedPage) => feedPage.data)
		.filter((feedItem) => Object.hasOwn(feedCardKinds, feedItem.kind));

	const handleFetchNextPage = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<FlatList
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
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
	footerLoading: { paddingTop: 8 },
});

export default CommunityFeed;
