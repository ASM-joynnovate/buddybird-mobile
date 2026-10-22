import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '設定',
	saveError: '無法儲存設定，已恢復為先前的值。\n請再試一次。',
	notifications: {
		title: '通知',
		all: '所有通知',
		permissionOff: '通知權限已關閉，因此無法接收通知',
	},
	general: {
		language: 'App 語言',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		simplifiedChinese: '简体中文',
		traditionalChinese: '繁體中文',
		thai: 'ไทย',
		devices: '已連結的裝置',
	},
	account: {
		signOut: '登出',
		withdraw: '刪除帳號',
	},
	support: {
		title: '支援',
		feedback: '傳送意見回饋',
		consents: '條款同意',
		version: 'App 版本 {{version}}',
	},
	signOutDialog: {
		title: '登出',
		message: '要在這台裝置上登出嗎？',
		confirm: '登出',
	},
	withdrawDialog: {
		title: '刪除帳號',
		message: 'Buddy 會很捨不得你的。真的要離開嗎？',
		warning: '刪除帳號後就無法復原。',
		confirm: '刪除帳號',
	},
	consents: {
		title: '條款同意',
		saveError: '無法儲存同意設定的變更，請再試一次。',
	},
	devices: {
		title: '已連結的裝置',
		thisDevice: '這台裝置',
		runningSession: '學習進行中',
		lastSeen: '上次使用：{{time}}',
		delete: '刪除{{name}}',
		deleteMessage: '刪除後，這台裝置將不會再收到通知。',
		sessionEnds: '這台裝置上正在進行的學習會結束。',
		deleteError: '無法刪除裝置，請再試一次。',
	},
};
