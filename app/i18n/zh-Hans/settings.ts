import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '设置',
	saveError: '无法保存设置，已恢复为之前的值。\n请重试。',
	notifications: {
		title: '通知',
		all: '全部通知',
		permissionOff: '通知权限已关闭，无法接收通知',
	},
	general: {
		title: '通用',
		languageAndCountry: '语言与国家/地区',
		language: 'App语言',
		languageSearchHint: '搜索语言名称',
		languageNotFound: '没有与“{{query}}”匹配的语言',
		country: '国家/地区',
		countryChoose: '请选择',
		countrySearchHint: '搜索国家/地区名称',
		countrySearchClear: '清除搜索内容',
		countryNotFound: '没有与“{{query}}”匹配的国家/地区',
		devices: '已连接的设备',
	},
	privacy: {
		title: '隐私设置',
		feed: '在动态中公开',
		feedDetail: '其他人可以看到你的学习记录和鹦鹉模仿的声音',
		leaderboard: '参与排行榜',
		leaderboardDetail: '其他人可以看到你的昵称、头像和学习时长',
		consents: '条款同意',
	},
	account: {
		signOut: '退出登录',
		withdraw: '注销账号',
	},
	support: {
		title: '支持',
		feedback: '发送反馈',
		version: 'App版本{{version}}',
	},
	signOutDialog: {
		title: '退出登录',
		message: '要在此设备上退出登录吗？',
		confirm: '退出登录',
	},
	withdrawDialog: {
		title: '注销账号',
		message: 'Buddy会很舍不得你的。确定要离开吗？',
		warning: '注销后将无法恢复。',
		confirm: '注销',
	},
	consents: {
		title: '条款同意',
		saveError: '无法保存同意设置的更改，请重试。',
	},
	devices: {
		title: '已连接的设备',
		thisDevice: '本机',
		runningSession: '正在学习',
		lastSeen: '上次连接：{{time}}',
		delete: '删除{{name}}',
		deleteMessage: '删除后，此设备将不再收到通知。',
		sessionEnds: '此设备上正在进行的学习将会结束。',
		deleteError: '无法删除设备，请重试。',
	},
};
