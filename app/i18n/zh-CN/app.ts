import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: '正在准备应用',
	},
	startupError: {
		title: '应用启动失败',
		message: '请检查网络连接后重试。',
	},
	feedback: {
		sentMessage: '你的宝贵意见已成功送达。我们会用它把 BuddyBird 做得更好。',
		retry: '重新发送',
		promptTitle: '说说你的想法吧',
		promptMessage: '欢迎随时留下使用 BuddyBird 的感受或期待。这对我们很有帮助！',
		write: '留下反馈',
		title: '发送反馈',
		placeholder: '可以随意写下需要改进的地方、不方便的地方或想要的功能。',
		privacy: '⚠ 请勿输入姓名、联系方式等个人信息。',
		send: '发送',
		sentTitle: '谢谢你！',
		sendError: '意见发送失败。内容已保留，请检查网络连接后重试。',
	},
	update: {
		title: '更新提醒',
		forcedTitle: '需要更新',
		message: 'BuddyBird {{version}} 版本已发布。',
		forcedMessage: '如需继续使用，请更新到 {{version}} 版本。',
		forcedMessageWithoutVersion: '如需继续使用，请更新应用。',
		accept: '更新',
		openStoreError: '无法打开应用商店，请重试。',
	},
};
