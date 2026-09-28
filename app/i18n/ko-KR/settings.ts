import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '설정',
	saveError: '설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 시도해 주세요.',
	care: {
		title: '앵무새 케어',
	},
	notifications: {
		title: '알림',
		notice: '공지 알림',
		report: '리포트 알림',
		marketing: '마케팅 알림',
		permissionOff: '알림 권한이 꺼져 있어 알림을 받을 수 없어요',
		permissionLink: '권한 상태에서 켜기',
	},
	general: {
		title: '일반',
		language: '앱 언어',
		korean: '한국어',
		english: 'English',
		devices: '연결된 기기',
		permissions: '권한 상태',
	},
	account: {
		title: '계정',
		signOut: '로그아웃',
		withdraw: '회원 탈퇴',
	},
	support: {
		title: '지원',
		feedback: '피드백 보내기',
		notices: '공지',
		unreadNotice: '읽지 않은 공지가 있어요',
		consents: '약관 동의',
		version: '앱 버전 {{version}}',
	},
	signOutDialog: {
		title: '로그아웃',
		message: '이 기기에서 로그아웃할까요?',
		confirm: '로그아웃',
	},
	withdrawDialog: {
		title: '회원 탈퇴',
		message: '버디가 많이 아쉬워할 거예요. 정말 떠나시겠어요?',
		warning: '탈퇴하면 되돌릴 수 없어요.',
		confirm: '탈퇴하기',
	},
	notices: {
		title: '공지',
		empty: '게시 중인 공지가 없어요',
		unread: '읽지 않음',
	},
	consents: {
		title: '약관 동의',
		saveError: '동의 변경을 저장하지 못했어요. 다시 시도해 주세요.',
	},
	devices: {
		title: '연결된 기기',
		thisDevice: '이 기기',
		runningSession: '세션 실행 중',
		lastSeen: '마지막 접속 {{time}}',
	},
	permissions: {
		title: '권한 상태',
		granted: '허용됨',
		denied: '허용 안 됨',
		checking: '확인 중',
	},
};
