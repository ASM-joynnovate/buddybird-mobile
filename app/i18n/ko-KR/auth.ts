import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Google로 계속하기',
		kakao: 'Kakao로 계속하기',
		apple: 'Apple로 계속하기',
	},
	signingIn: {
		google: 'Google 로그인 중이에요',
		kakao: 'Kakao 로그인 중이에요',
		apple: 'Apple 로그인 중이에요',
	},
	completing: '버디버드 로그인을 마무리하고 있어요',
	existingAccount: {
		title: {
			google: '이미 가입한 Google 계정이에요.',
			kakao: '이미 가입한 카카오 계정이에요.',
			apple: '이미 가입한 Apple 계정이에요.',
		},
		body: '다시 누르면 그 계정으로 로그인하고, 지금까지 기록한 내용은 옮겨지지 않아요.',
	},
	signInError: '로그인하지 못했어요. 연결을 확인하고 로그인 버튼을 다시 눌러 주세요.',
	lastLogin: '최근 로그인',
	lastLoginHint: '마지막으로 로그인한 방법이에요',
	signOutError: '로그아웃하지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
	signIn: '로그인',
};
