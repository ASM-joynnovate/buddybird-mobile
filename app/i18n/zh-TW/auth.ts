import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: '使用 Google 繼續',
		kakao: '使用 Kakao 繼續',
		apple: '使用 Apple 繼續',
	},
	signingIn: {
		google: '正在使用 Google 登入',
		kakao: '正在使用 Kakao 登入',
		apple: '正在使用 Apple 登入',
	},
	completing: '正在完成 BuddyBird 登入',
	existingAccount: {
		title: '你已經有註冊過的帳號',
		message: '要改用那個帳號登入嗎？目前為止記錄的內容不會移過去。',
	},
	signInError: '無法登入。請檢查連線，再點一次登入按鈕。',
	lastLogin: '上次登入',
	lastLoginHint: '這是你上次登入的方式',
	signOutError: '無法登出。請檢查連線後再試一次。',
	signIn: '登入',
};
