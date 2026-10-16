import type { NotificationSettingList } from '@/types/apis/settings';

/** 모든 알림 설정 항목을 모으는 함수 */
export const allNotificationSettingItems = (notificationSettings: NotificationSettingList) => {
	return [...notificationSettings.items, ...notificationSettings.groups.flatMap((group) => group.items)];
};
