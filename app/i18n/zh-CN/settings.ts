import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '设置',
	saveError: '设置保存失败，已恢复为之前的值。\n请重试。',
	notifications: {
		title: '通知',
		all: '全部通知',
		permissionOff: '通知权限已关闭，无法接收通知',
	},
	general: {
		language: '应用语言',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		simplifiedChinese: '简体中文',
		traditionalChinese: '繁體中文',
		thai: 'ไทย',
		devices: '已连接设备',
	},
	account: {
		signOut: '退出登录',
		withdraw: '注销账号',
	},
	support: {
		title: '支持',
		feedback: '发送反馈',
		consents: '条款同意',
		version: '应用版本 {{version}}',
	},
	signOutDialog: {
		title: '退出登录',
		message: '要在这台设备上退出登录吗？',
		confirm: '退出登录',
	},
	withdrawDialog: {
		title: '注销账号',
		message: 'Buddy 会很舍不得你的。真的要离开吗？',
		warning: '注销后将无法恢复。',
		confirm: '注销',
	},
	consents: {
		title: '条款同意',
		saveError: '同意设置的更改保存失败，请重试。',
	},
	devices: {
		title: '已连接设备',
		thisDevice: '本机',
		runningSession: '学习进行中',
		lastSeen: '上次在线 {{time}}',
		delete: '删除{{name}}',
		deleteMessage: '删除后，这台设备将不再收到通知。',
		sessionEnds: '这台设备上正在进行的学习将会结束。',
		deleteError: '设备删除失败，请重试。',
	},
};
