import { getAnnouncementList } from '@/apis/announcements';
import { getNotificationUnreadCount } from '@/apis/notifications';
import { getRunningSession } from '@/apis/sessions';

import type { HomeSummary } from '@/types/apis/home';

import * as Sentry from '@sentry/react-native';

export const getHomeSummary = async (): Promise<HomeSummary> => {
	const [runningSession, notificationUnreadCount, announcementPage] = await Sentry.startSpan(
		{ name: 'home.summary' },
		() => Promise.all([getRunningSession(), getNotificationUnreadCount(), getAnnouncementList({ page: 1 })]),
	);

	return {
		running_session: runningSession,
		unread_notification_count: notificationUnreadCount.count,
		unread_announcements: announcementPage.data.filter((announcement) => !announcement.is_read),
	};
};
