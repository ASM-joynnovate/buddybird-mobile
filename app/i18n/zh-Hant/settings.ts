import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '設定',
	saveError: '無法儲存設定，已還原為先前的值。\n請再試一次。',
	notifications: {
		title: '通知',
		all: '所有通知',
		permissionOff: '通知權限已關閉，無法接收通知',
	},
	general: {
		title: '一般',
		languageAndCountry: '語言與國家或地區',
		language: 'App 語言',
		country: '國家或地區',
		countryChoose: '請選擇',
		countrySearchHint: '搜尋國家或地區名稱',
		countrySearchClear: '清除搜尋內容',
		countryNotFound: '找不到符合「{{query}}」的國家或地區',
		devices: '已連結的裝置',
	},
	privacy: {
		title: '隱私權設定',
		feed: '公開到動態',
		feedDetail: '其他人可以看到你的學習記錄和鸚鵡模仿的聲音',
		leaderboard: '參加排行榜',
		leaderboardDetail: '其他人可以看到你的暱稱、照片和學習時間',
		consents: '條款同意',
	},
	account: {
		signOut: '登出',
		withdraw: '刪除帳號',
	},
	support: {
		title: '支援',
		feedback: '傳送意見回饋',
		version: 'App 版本 {{version}}',
	},
	signOutDialog: {
		title: '登出',
		message: '要在這部裝置上登出嗎？',
		confirm: '登出',
	},
	withdrawDialog: {
		title: '刪除帳號',
		message: 'Buddy 會很捨不得你的。確定要離開嗎？',
		warning: '刪除帳號後就無法復原。',
		confirm: '刪除帳號',
	},
	consents: {
		title: '條款同意',
		saveError: '無法儲存同意變更，請再試一次。',
	},
	devices: {
		title: '已連結的裝置',
		thisDevice: '這部裝置',
		runningSession: '正在學習中',
		lastSeen: '上次連線：{{time}}',
		delete: '刪除「{{name}}」',
		deleteMessage: '刪除後，這部裝置就不會再收到通知。',
		sessionEnds: '在這部裝置上進行中的學習將會結束。',
		deleteError: '無法刪除裝置，請再試一次。',
	},
};
