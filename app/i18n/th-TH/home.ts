import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'การแจ้งเตือน',
	notificationsUnread: 'การแจ้งเตือน ยังไม่ได้อ่าน {{count}} รายการ',
	announcement: {
		viewDetail: 'ดูรายละเอียด',
		image: 'รูปภาพแนบ {{index}}',
	},
	notification: {
		viewImage: 'ดูรูปภาพขนาดใหญ่',
	},
	notificationList: {
		title: 'การแจ้งเตือน',
		notifications: 'การแจ้งเตือน',
		announcements: 'ประกาศ',
		readAll: 'อ่านทั้งหมด',
		readAllError: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมดไม่สำเร็จ โปรดกดอีกครั้ง',
		unread: 'ยังไม่ได้อ่าน',
		empty: 'ยังไม่มีการแจ้งเตือน',
	},
	announcementList: {
		unread: 'ยังไม่ได้อ่าน',
		empty: 'ยังไม่มีประกาศในขณะนี้',
	},
};
