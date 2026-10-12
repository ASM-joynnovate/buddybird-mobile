import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: '通知',
	notificationsUnread: '通知、未読{{count}}件',
	announcement: {
		viewDetail: '詳しく見る',
		image: '添付画像{{index}}',
	},
	notification: {
		viewImage: '写真を大きく表示',
	},
	notificationList: {
		title: '通知',
		notifications: '通知',
		announcements: 'お知らせ',
		readAll: 'すべて既読',
		readAllError: 'すべて既読にできませんでした。もう一度タップしてください。',
		unread: '未読',
		empty: 'まだ通知はありません',
	},
	announcementList: {
		unread: '未読',
		empty: '掲載中のお知らせはありません',
	},
};
