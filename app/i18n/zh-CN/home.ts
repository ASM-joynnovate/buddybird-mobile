import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: '通知',
	notificationsUnread: '通知，{{count}} 条未读',
	announcement: {
		viewDetail: '详情',
		image: '附件图片 {{index}}',
	},
	notification: {
		viewImage: '查看大图',
	},
	notificationList: {
		title: '通知',
		notifications: '通知',
		announcements: '公告',
		readAll: '全部已读',
		readAllError: '无法全部标记为已读，请再点一次。',
		unread: '未读',
		empty: '还没有收到通知',
	},
	announcementList: {
		unread: '未读',
		empty: '暂无公告',
	},
};
