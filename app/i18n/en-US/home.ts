import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'Notifications',
	notificationsUnread: 'Notifications, {{count}} unread',
	settings: 'Settings',
	notice: {
		viewDetail: 'Details',
		image: 'Attached image {{index}}',
	},
	notificationList: {
		title: 'Notifications',
		readAll: 'Mark all read',
		readAllError: "Couldn't mark all as read. Tap again.",
		unread: 'Unread',
		empty: 'No notifications yet',
		emptyScene: 'Buddy by an empty inbox',
	},
};
