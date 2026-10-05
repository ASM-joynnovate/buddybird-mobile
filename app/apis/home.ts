import { getAnnouncementList } from '@/apis/announcements';
import { getNotificationList } from '@/apis/notifications';
import { getRunningSession } from '@/apis/sessions';

import type { HomeSummary } from '@/types/apis/home';

import * as Sentry from '@sentry/react-native';

export const getHomeSummary = async (): Promise<HomeSummary> => {
	const [runningSession, notificationPage, announcementPage] = await Sentry.startSpan({ name: 'home.summary' }, () =>
		Promise.all([getRunningSession(), getNotificationList({ page: 1 }), getAnnouncementList({ page: 1 })]),
	);

	return {
		running_session: runningSession,
		unread_notification_count: notificationPage.data.filter((notification) => !notification.read_at).length,
		unread_announcements: announcementPage.data.filter((announcement) => !announcement.is_read),
	};
};
