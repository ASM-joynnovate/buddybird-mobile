import type { AppNotification } from '@/types/apis/notifications';

import { useReadNotification } from '@/hooks/apis/notifications';

import { useLinkTo } from '@react-navigation/native';

import { track } from '@/services/telemetry/client';
import { notificationPath } from '@/utils/notification';

export function useOpenNotification(): (item: AppNotification) => void {
	const linkTo = useLinkTo();

	const { mutate } = useReadNotification();

	return (item) => {
		if (!item.read_at) {
			mutate({ id: item.id });
		}

		track('notification_opened', { kind: item.kind, from: 'list' });

		linkTo(notificationPath(item));
	};
}
