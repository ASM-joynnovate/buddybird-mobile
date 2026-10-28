import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'Thông báo',
	notificationsUnread: 'Thông báo, {{count}} thông báo chưa đọc',
	announcement: {
		viewDetail: 'Chi tiết',
		image: 'Ảnh đính kèm {{index}}',
	},
	notification: {
		viewImage: 'Xem ảnh lớn',
	},
	notificationList: {
		title: 'Thông báo',
		notifications: 'Thông báo',
		announcements: 'Tin tức',
		readAll: 'Đọc tất cả',
		readAllError: 'Không đánh dấu được tất cả là đã đọc. Vui lòng chạm lại.',
		unread: 'Chưa đọc',
		empty: 'Bạn chưa nhận được thông báo nào',
	},
	announcementList: {
		unread: 'Chưa đọc',
		empty: 'Hiện chưa có tin tức nào',
	},
};
