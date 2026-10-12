import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Googleで続ける',
		kakao: 'Kakaoで続ける',
		apple: 'Appleで続ける',
	},
	signingIn: {
		google: 'Googleでログインしています',
		kakao: 'Kakaoでログインしています',
		apple: 'Appleでログインしています',
	},
	completing: 'BuddyBirdへのログインを完了しています',
	existingAccount: {
		title: 'すでに登録したアカウントがあります',
		message: 'そのアカウントでログインしますか？これまでに記録した内容は引き継がれません。',
	},
	signInError: 'ログインできませんでした。接続を確認して、ログインボタンをもう一度タップしてください。',
	lastLogin: '前回のログイン',
	lastLoginHint: '前回ログインした方法です',
	signOutError: 'ログアウトできませんでした。接続を確認して、もう一度試してみてください。',
	signIn: 'ログイン',
};
