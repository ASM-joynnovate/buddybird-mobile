import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: '正在準備 App',
	},
	startupError: {
		title: '無法啟動 App',
		message: '請確認網路連線，然後再試一次。',
	},
	feedback: {
		sentMessage: '已收到你寶貴的意見！我們會參考你的意見，讓 BuddyBird 變得更好。',
		retry: '重新傳送',
		promptTitle: '說說你的想法吧',
		promptMessage: '歡迎自由分享使用 BuddyBird 的感想或期待，這對我們幫助很大！',
		write: '留下意見回饋',
		title: '傳送意見回饋',
		placeholder: '歡迎自由寫下希望改進的地方、不方便的地方或想要的功能。',
		privacy: '⚠ 請勿輸入姓名、聯絡方式等個人資料。',
		send: '傳送',
		sentTitle: '謝謝你！',
		sendError: '無法傳送意見。內容已為你保留，請確認網路連線後再試一次。',
	},
	update: {
		title: '更新通知',
		forcedTitle: '需要更新',
		message: '現在可以更新至 BuddyBird {{version}} 版。',
		forcedMessage: '請更新至 {{version}} 版以繼續使用。',
		forcedMessageWithoutVersion: '請更新 App 以繼續使用。',
		accept: '更新',
		openStoreError: '無法開啟商店，請再試一次。',
	},
};
