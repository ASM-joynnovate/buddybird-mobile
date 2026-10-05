interface OpenedNotification {
	kind: string;
	notification_id?: string;
	data_id?: string | null;
}

/** 알림으로 열 화면 경로를 반환하는 함수 */
export const notificationPath = ({ kind, notification_id, data_id }: OpenedNotification) => {
	if (kind === 'report') {
		return data_id ? `/sessions/${data_id}?source=notification` : null;
	}

	if (kind === 'announcement' && data_id) {
		return `/announcements/${data_id}`;
	}

	if (kind === 'marketing') {
		return '/settings/notifications';
	}

	return notification_id ? `/notifications/${notification_id}` : null;
};
