import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: '正在准备App',
	},
	startupError: {
		title: '无法启动App',
		message: '请检查网络连接，然后重试。',
	},
	feedback: {
		sentMessage: '你的宝贵意见已收到，我们会用它来把BuddyBird做得更好。',
		retry: '重新发送',
		promptTitle: '说说你的想法',
		promptMessage: '使用BuddyBird时有什么感受或期待，都可以随意告诉我们。这对我们帮助很大！',
		write: '写反馈',
		title: '发送反馈',
		placeholder: '可以随意写下需要改进的地方、不方便的地方或希望增加的功能。',
		privacy: '⚠ 请勿填写姓名、联系方式等个人信息。',
		send: '发送',
		sentTitle: '谢谢你！',
		sendError: '无法发送你的意见。内容已保留，请检查网络连接后重试。',
	},
	update: {
		title: '更新提醒',
		forcedTitle: '需要更新',
		message: 'BuddyBird {{version}}版本现已推出。',
		forcedMessage: '如需继续使用，请更新到{{version}}版本。',
		forcedMessageWithoutVersion: '如需继续使用，请更新App。',
		accept: '更新',
		openStoreError: '无法打开应用商店，请重试。',
	},
};
