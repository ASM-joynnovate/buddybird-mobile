import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'การตั้งค่า',
	saveError: 'บันทึกการตั้งค่าไม่ได้ จึงเปลี่ยนกลับเป็นค่าเดิม\nโปรดลองอีกครั้ง',
	notifications: {
		title: 'การแจ้งเตือน',
		all: 'การแจ้งเตือนทั้งหมด',
		permissionOff: 'สิทธิ์การแจ้งเตือนปิดอยู่ จึงไม่ได้รับการแจ้งเตือน',
	},
	general: {
		title: 'ทั่วไป',
		languageAndCountry: 'ภาษาและประเทศ',
		language: 'ภาษาของแอป',
		country: 'ประเทศ',
		countryChoose: 'โปรดเลือก',
		countrySearchHint: 'ค้นหาชื่อประเทศ',
		countrySearchClear: 'ล้างคำค้นหา',
		countryNotFound: 'ไม่พบประเทศที่ตรงกับ “{{query}}”',
		devices: 'อุปกรณ์ที่เชื่อมต่อ',
	},
	privacy: {
		title: 'การตั้งค่าความเป็นส่วนตัว',
		feed: 'แสดงบนฟีด',
		feedDetail: 'คนอื่นจะเห็นบันทึกการฝึกพูดและเสียงที่นกแก้วพูดตาม',
		leaderboard: 'เข้าร่วมลีดเดอร์บอร์ด',
		leaderboardDetail: 'คนอื่นจะเห็นชื่อเล่น รูป และเวลาฝึกพูดของคุณ',
		consents: 'ข้อกำหนดและความยินยอม',
	},
	account: {
		signOut: 'ออกจากระบบ',
		withdraw: 'ลบบัญชี',
	},
	support: {
		title: 'ความช่วยเหลือ',
		feedback: 'ส่งความคิดเห็น',
		version: 'แอปเวอร์ชัน {{version}}',
	},
	signOutDialog: {
		title: 'ออกจากระบบ',
		message: 'ออกจากระบบในอุปกรณ์นี้ไหม',
		confirm: 'ออกจากระบบ',
	},
	withdrawDialog: {
		title: 'ลบบัญชี',
		message: 'บัดดี้คงเสียดายมากเลย แน่ใจไหมว่าจะไปจริง ๆ',
		warning: 'ลบบัญชีแล้วจะกู้คืนไม่ได้',
		confirm: 'ลบบัญชี',
	},
	consents: {
		title: 'ข้อกำหนดและความยินยอม',
		saveError: 'บันทึกการเปลี่ยนแปลงความยินยอมไม่ได้ โปรดลองอีกครั้ง',
	},
	devices: {
		title: 'อุปกรณ์ที่เชื่อมต่อ',
		thisDevice: 'อุปกรณ์นี้',
		runningSession: 'กำลังฝึกพูด',
		lastSeen: 'ใช้งานล่าสุด {{time}}',
		delete: 'ลบ {{name}}',
		deleteMessage: 'เมื่อลบแล้ว อุปกรณ์นี้จะไม่ได้รับการแจ้งเตือนอีก',
		sessionEnds: 'การฝึกพูดที่กำลังดำเนินอยู่ในอุปกรณ์นี้จะสิ้นสุดลง',
		deleteError: 'ลบอุปกรณ์ไม่ได้ โปรดลองอีกครั้ง',
	},
};
