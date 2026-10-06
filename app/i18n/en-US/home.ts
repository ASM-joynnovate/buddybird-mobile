import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'Notifications',
	notificationsUnread: 'Notifications, {{count}} unread',
	announcement: {
		viewDetail: 'Details',
		image: 'Attached image {{index}}',
	},
	notification: {
		viewImage: 'View photo in full screen',
	},
	notificationList: {
		title: 'Notifications',
		notifications: 'Notifications',
		announcements: 'Announcements',
		readAll: 'Mark all read',
		readAllError: "Couldn't mark all as read. Tap again.",
		unread: 'Unread',
		empty: 'No notifications yet',
	},
	announcementList: {
		unread: 'Unread',
		empty: 'No announcements right now',
	},
};
