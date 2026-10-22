import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { getFeedReactionTypeListOptions, useGetFeedItemList } from '@/hooks/apis/feed';
import { getLeaderboardOptions } from '@/hooks/apis/leaderboard';
import { useGetMe } from '@/hooks/apis/users';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import FeedCard, { feedCardKinds } from '@/screens/community/components/feed-card';
import LeaderboardCard from '@/screens/community/components/leaderboard-card';
import { useCommunityStore } from '@/stores/community';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

/** 순위 카드 및 피드 목록 컴포넌트 */
const CommunityFeed = () => {
	const { t } = useTranslation();

	const player = useSoundPlayer();

	const { data: meData } = useGetMe();

	const countryScope = useCommunityStore((state) => state.countryScope);

	const country = countryScope === 'mine' ? (meData.country ?? null) : null;

	usePrefetchQuery(getLeaderboardOptions({ country }));
	usePrefetchQuery(getFeedReactionTypeListOptions());

	const { data: feedData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFeedItemList({ country });

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
			ListHeaderComponent={
				<>
					<LeaderboardCard />
					<Copy accessibilityRole="header" style={styles.sectionTitle}>
						{t('community.feed.title')}
					</Copy>
				</>
			}
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
	sectionTitle: { marginTop: 16, marginHorizontal: 8, fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	footerLoading: { paddingTop: 8 },
});

export default CommunityFeed;
