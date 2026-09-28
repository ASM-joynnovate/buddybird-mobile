import type { NotificationKind } from '@/types/apis/notifications';

import { localDate } from '@/utils/date';

type OpenedNotification = {
	kind: NotificationKind;
	report_date?: string | null;
	sent_at: string;
};

export function notificationPath({ kind, report_date, sent_at }: OpenedNotification): string {
	if (kind === 'streak') {
		return '/report?source=notification';
	}

	const date = kind === 'mimicry' ? localDate(sent_at) : report_date;

	return date ? `/report?period=day&date=${date}&source=notification` : '/report?period=day&source=notification';
}
