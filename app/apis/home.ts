import { getNoticeList } from '@/apis/notices';
import { getNotificationList } from '@/apis/notifications';
import { getRunningSession } from '@/apis/sessions';

import type { HomeSummary } from '@/types/apis/home';

export const getHomeSummary = async (): Promise<HomeSummary> => {
	const [runningSession, notificationPage, noticePage] = await Promise.all([
		getRunningSession(),
		getNotificationList({ page: 1 }),
		getNoticeList({ page: 1 }),
	]);

	return {
		running_session: runningSession,
		unread_notification_count: notificationPage.data.filter((notification) => !notification.read_at).length,
		unread_notices: noticePage.data.filter((notice) => !notice.is_read),
	};
};
