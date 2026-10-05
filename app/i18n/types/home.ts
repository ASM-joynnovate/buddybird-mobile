export type HomeMessages = {
	brand: string;
	notifications: string;
	notificationsUnread: string;
	announcement: {
		viewDetail: string;
		image: string;
	};
	notificationList: {
		title: string;
		notifications: string;
		announcements: string;
		readAll: string;
		readAllError: string;
		unread: string;
		empty: string;
	};
	announcementList: {
		unread: string;
		empty: string;
	};
};
