import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: '通知',
	notificationsUnread: '通知，{{count}} 則未讀',
	announcement: {
		viewDetail: '查看詳情',
		image: '附加圖片 {{index}}',
	},
	notification: {
		viewImage: '放大檢視照片',
	},
	notificationList: {
		title: '通知',
		notifications: '通知',
		announcements: '公告',
		readAll: '全部標為已讀',
		readAllError: '無法全部標為已讀，請再點一次。',
		unread: '未讀',
		empty: '還沒有收到任何通知',
	},
	announcementList: {
		unread: '未讀',
		empty: '目前沒有公告',
	},
};
