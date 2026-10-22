import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'การตั้งค่า',
	saveError: 'บันทึกการตั้งค่าไม่สำเร็จ จึงเปลี่ยนกลับเป็นค่าเดิม\nโปรดลองอีกครั้ง',
	notifications: {
		title: 'การแจ้งเตือน',
		all: 'การแจ้งเตือนทั้งหมด',
		permissionOff: 'สิทธิ์การแจ้งเตือนปิดอยู่ จึงไม่ได้รับการแจ้งเตือน',
	},
	general: {
		language: 'ภาษาของแอป',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		simplifiedChinese: '简体中文',
		traditionalChinese: '繁體中文',
		thai: 'ไทย',
		devices: 'อุปกรณ์ที่เชื่อมต่อ',
	},
	account: {
		signOut: 'ออกจากระบบ',
		withdraw: 'ลบบัญชี',
	},
	support: {
		title: 'ช่วยเหลือ',
		feedback: 'ส่งความคิดเห็น',
		consents: 'การยอมรับข้อกำหนด',
		version: 'เวอร์ชันแอป {{version}}',
	},
	signOutDialog: {
		title: 'ออกจากระบบ',
		message: 'ต้องการออกจากระบบบนอุปกรณ์นี้ไหม',
		confirm: 'ออกจากระบบ',
	},
	withdrawDialog: {
		title: 'ลบบัญชี',
		message: 'บัดดี้คงเสียใจมากเลย แน่ใจนะว่าจะไปจริง ๆ',
		warning: 'เมื่อลบบัญชีแล้วจะกู้คืนไม่ได้',
		confirm: 'ลบบัญชี',
	},
	consents: {
		title: 'การยอมรับข้อกำหนด',
		saveError: 'บันทึกการเปลี่ยนแปลงการยินยอมไม่สำเร็จ โปรดลองอีกครั้ง',
	},
	devices: {
		title: 'อุปกรณ์ที่เชื่อมต่อ',
		thisDevice: 'อุปกรณ์นี้',
		runningSession: 'กำลังฝึกอยู่',
		lastSeen: 'ใช้งานล่าสุด {{time}}',
		delete: 'ลบ {{name}}',
		deleteMessage: 'เมื่อลบแล้ว อุปกรณ์นี้จะไม่ได้รับการแจ้งเตือนอีก',
		sessionEnds: 'การฝึกที่กำลังดำเนินอยู่บนอุปกรณ์นี้จะสิ้นสุดลง',
		deleteError: 'ลบอุปกรณ์ไม่สำเร็จ โปรดลองอีกครั้ง',
	},
};
