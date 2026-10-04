import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { useGetNotificationList } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import NotificationItem from '@/screens/home/components/notification-item';
import { colors } from '@/theme';

import { EmptyState } from '@/components/ui/empty-state';

/** 받은 알림 목록 컴포넌트 */
const NotificationList = () => {
	const { t } = useTranslation();

	const { data: notificationListData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotificationList();

	const notifications = notificationListData.pages.flatMap((notificationPage) => notificationPage.data);

	const handleFetchNextPage = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<FlatList
			data={notifications}
			keyExtractor={(notification) => notification.id}
			renderItem={({ item: notification }) => <NotificationItem notification={notification} />}
			ListEmptyComponent=<EmptyState message={t('home.notificationList.empty')} />
			onEndReachedThreshold={0.4}
			onEndReached={handleFetchNextPage}
			ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.orange} /> : null}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
		/>
	);
};

const styles = StyleSheet.create({
	list: { flexGrow: 1, paddingBottom: 32 },
});

export default NotificationList;
