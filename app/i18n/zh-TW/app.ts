import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: '正在準備 App',
	},
	startupError: {
		title: '無法啟動 App',
		message: '請檢查網路連線後再試一次。',
	},
	feedback: {
		sentMessage: '已經收到你寶貴的意見了！我們會用來讓 BuddyBird 變得更好。',
		retry: '重新傳送',
		promptTitle: '說說你的想法',
		promptMessage: '使用 BuddyBird 的感想或希望改進的地方，都歡迎自由留言。這對我們幫助很大！',
		write: '留下意見回饋',
		title: '傳送意見回饋',
		placeholder: '希望改進的地方、不好用的地方、想要的功能，都可以自由寫下來。',
		privacy: '⚠ 請勿輸入姓名、聯絡方式等個人資料。',
		send: '傳送',
		sentTitle: '謝謝你！',
		sendError: '無法傳送你的意見。內容已經幫你保留，請檢查連線後再試一次。',
	},
	update: {
		title: '更新通知',
		forcedTitle: '需要更新',
		message: 'BuddyBird {{version}} 版已推出。',
		forcedMessage: '請更新到 {{version}} 版以繼續使用。',
		forcedMessageWithoutVersion: '請更新 App 以繼續使用。',
		accept: '更新',
		openStoreError: '無法開啟商店，請再試一次。',
	},
};
