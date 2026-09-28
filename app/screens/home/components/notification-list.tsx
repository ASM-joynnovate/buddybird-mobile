import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { useGetNotificationList } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { BellIcon } from 'lucide-react-native';

import { NotificationItem } from '@/screens/home/components/notification-item';
import { useOpenNotification } from '@/screens/home/hooks/use-open-notification';
import { colors } from '@/theme';

import { Illustration } from '@/components/illustration';
import { EmptyState } from '@/components/ui/empty-state';

/** 알림 목록 컴포넌트 */
const NotificationList = () => {
	const { t } = useTranslation();

	const { data: notificationListData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotificationList();

	const open = useOpenNotification();

	const notifications = notificationListData.pages.flatMap((notificationPage) => notificationPage.data);
	const emptyContent = (
		<EmptyState
			message={t('home.notification.empty')}
			illustration=<Illustration scene={t('home.notification.emptyScene')} icon={BellIcon} height={180} />
		/>
	);

	/** 다음 쪽 알림 불러오기 */
	const handleFetchNextPage = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<FlatList
			data={notifications}
			keyExtractor={(notification) => notification.id}
			renderItem={({ item: notification }) => <NotificationItem item={notification} onOpen={open} />}
			ListEmptyComponent={emptyContent}
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
