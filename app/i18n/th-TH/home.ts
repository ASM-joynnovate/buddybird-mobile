import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'การแจ้งเตือน',
	notificationsUnread: 'การแจ้งเตือน ยังไม่ได้อ่าน {{count}} รายการ',
	announcement: {
		viewDetail: 'ดูรายละเอียด',
		image: 'รูปภาพที่แนบ {{index}}',
	},
	notification: {
		viewImage: 'ดูรูปขนาดใหญ่',
	},
	notificationList: {
		title: 'การแจ้งเตือน',
		notifications: 'การแจ้งเตือน',
		announcements: 'ประกาศ',
		readAll: 'อ่านแล้วทั้งหมด',
		readAllError: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมดไม่ได้ โปรดแตะอีกครั้ง',
		unread: 'ยังไม่ได้อ่าน',
		empty: 'ยังไม่มีการแจ้งเตือน',
	},
	announcementList: {
		unread: 'ยังไม่ได้อ่าน',
		empty: 'ไม่มีประกาศในขณะนี้',
	},
};
