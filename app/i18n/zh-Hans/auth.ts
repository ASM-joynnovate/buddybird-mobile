import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: '通过Google继续',
		kakao: '通过Kakao继续',
		apple: '通过Apple继续',
	},
	signingIn: {
		google: '正在通过Google登录',
		kakao: '正在通过Kakao登录',
		apple: '正在通过Apple登录',
	},
	completing: '正在完成BuddyBird登录',
	existingAccount: {
		title: '你已有注册的账号',
		message: '要登录该账号吗？目前为止的记录不会转移过去。',
	},
	signInError: '无法登录。请检查网络连接，然后再次轻点登录按钮。',
	lastLogin: '最近登录',
	lastLoginHint: '这是你上次使用的登录方式',
	signOutError: '无法退出登录，请检查网络连接后重试。',
	signIn: '登录',
};
