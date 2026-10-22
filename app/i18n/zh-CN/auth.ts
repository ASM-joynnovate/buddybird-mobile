import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: '通过 Google 继续',
		kakao: '通过 Kakao 继续',
		apple: '通过 Apple 继续',
	},
	signingIn: {
		google: '正在通过 Google 登录',
		kakao: '正在通过 Kakao 登录',
		apple: '正在通过 Apple 登录',
	},
	completing: '正在完成 BuddyBird 登录',
	existingAccount: {
		title: '你已有注册的账号',
		message: '要登录那个账号吗？目前为止的记录不会被转移。',
	},
	signInError: '登录失败。请检查网络连接后再次点击登录按钮。',
	lastLogin: '最近登录',
	lastLoginHint: '这是你上次使用的登录方式',
	signOutError: '退出登录失败。请检查网络连接后重试。',
	signIn: '登录',
};
