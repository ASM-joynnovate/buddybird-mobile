import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';

import { getNotificationListOptions, useReadAllNotifications } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import { BellIcon } from 'lucide-react-native';

import { NotificationItem } from '@/screens/home/components/notification-item';
import { useOpenNotification } from '@/screens/home/hooks/use-open-notification';
import { colors, contentMaxWidth } from '@/theme';

import { Illustration } from '@/components/illustration';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TextButton } from '@/components/ui/text-button';

export function NotificationsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const {
		data: notificationListData,
		isError: isNotificationListError,
		refetch,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	} = useInfiniteQuery(getNotificationListOptions());

	const { isError, isPending, mutate } = useReadAllNotifications();

	const open = useOpenNotification();

	const items = notificationListData?.pages.flatMap((page) => page.data) ?? [];
	const hasUnread = items.some((item) => !item.read_at);

	let empty = <Skeleton rows={5} />;

	if (isNotificationListError) {
		empty = <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
	} else if (notificationListData) {
		empty = (
			<EmptyState
				message={t('home.notification.empty')}
				illustration=<Illustration scene={t('home.notification.emptyScene')} icon={BellIcon} height={180} />
			/>
		);
	}

	return (
		<Screen scroll={false}>
			{/*헤더와 모두 읽음 실패 안내*/}
			<View style={styles.header}>
				<ScreenHeader
					title={t('home.notification.title')}
					onBack={() => navigation.goBack()}
					right=<TextButton
						label={t('home.notification.readAll')}
						disabled={!hasUnread || isPending}
						onPress={() => mutate({})}
					/>
				/>
				<InlineError message={isError ? t('home.notification.readAllError') : null} />
			</View>

			{/*알림 목록*/}
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <NotificationItem item={item} onOpen={open} />}
				ListEmptyComponent={empty}
				onEndReachedThreshold={0.4}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						void fetchNextPage();
					}
				}}
				ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.orange} /> : null}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create({
	header: {
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	list: {
		flexGrow: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingBottom: 32,
	},
});
