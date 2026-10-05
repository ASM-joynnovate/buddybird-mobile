import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';

import { getAnnouncementListOptions } from '@/hooks/apis/announcements';
import { useReadAllNotifications } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';

import AnnouncementList from '@/screens/home/components/announcement-list';
import AnnouncementListSkeleton from '@/screens/home/components/announcement-list-skeleton';
import NotificationList from '@/screens/home/components/notification-list';
import NotificationListSkeleton from '@/screens/home/components/notification-list-skeleton';
import { useMessageStore } from '@/stores/message';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';

/** 알림 목록 화면 */
const NotificationsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const [shownList, setShownList] = useState<'notifications' | 'announcements'>('notifications');

	const { data: announcementListData } = useInfiniteQuery({ ...getAnnouncementListOptions(), throwOnError: false });

	const { isPending, mutate } = useReadAllNotifications();

	const openPopup = useMessageStore((state) => state.openPopup);

	const hasUnreadAnnouncement = Boolean(
		announcementListData?.pages.some((announcementPage) =>
			announcementPage.data.some((announcement) => !announcement.is_read),
		),
	);

	const handleReadAll = () => {
		if (isPending) {
			return;
		}

		mutate({}, { onError: () => openPopup({ title: t('home.notificationList.readAllError') }) });
	};

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader
					title={t('home.notificationList.title')}
					onBack={() => navigation.goBack()}
					trailing={
						shownList === 'notifications' && (
							<TextButton
								label={t('home.notificationList.readAll')}
								disabled={isPending}
								onPress={handleReadAll}
							/>
						)
					}
				/>

				{/*알림 목록 및 공지 목록을 바꾸는 Chip*/}
				<View style={styles.chipsRow}>
					<Chip
						label={t('home.notificationList.notifications')}
						selected={shownList === 'notifications'}
						onPress={() => setShownList('notifications')}
					/>
					<Chip
						label={t('home.notificationList.announcements')}
						selected={shownList === 'announcements'}
						showDot={hasUnreadAnnouncement}
						onPress={() => setShownList('announcements')}
					/>
				</View>

				{shownList === 'notifications' && (
					<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<NotificationListSkeleton />>
						<NotificationList />
					</ErrorHandlingWrapper>
				)}
				{shownList === 'announcements' && (
					<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<AnnouncementListSkeleton />>
						<AnnouncementList />
					</ErrorHandlingWrapper>
				)}
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	chipsRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
});

export default NotificationsScreen;
