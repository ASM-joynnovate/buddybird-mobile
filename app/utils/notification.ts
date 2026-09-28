import type { NotificationKind } from '@/types/apis/notifications';

import { localDate } from '@/utils/date';

interface OpenedNotification {
	kind: NotificationKind;
	report_date?: string | null;
	sent_at: string;
}

/** 알림 종류와 날짜에 맞는 리포트 화면 경로 */
export const notificationPath = ({ kind, report_date, sent_at }: OpenedNotification) => {
	if (kind === 'streak') {
		return '/report?source=notification';
	}

	const date = kind === 'mimicry' ? localDate(sent_at) : report_date;

	return date ? `/report?period=day&date=${date}&source=notification` : '/report?period=day&source=notification';
};
