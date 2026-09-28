import { fetchNotices } from '@/apis/notices';
import { fetchNotifications } from '@/apis/notifications';
import { fetchRunningSession } from '@/apis/sessions';

import type { HomeSummary } from '@/types/apis/home';

export async function fetchHomeSummary(): Promise<HomeSummary> {
	const [runningSession, notifications, notices] = await Promise.all([
		fetchRunningSession(),
		fetchNotifications(1),
		fetchNotices(1),
	]);

	return {
		running_session: runningSession,
		unread_notification_count: notifications.data.filter((item) => !item.read_at).length,
		unread_notices: notices.data.filter((notice) => !notice.is_read),
	};
}
