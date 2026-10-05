import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '설정',
	saveError: '설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 시도해 주세요.',
	notifications: {
		title: '알림',
		all: '전체 알림',
		notice: '공지 알림',
		report: '리포트 알림',
		marketing: '마케팅 알림',
		permissionOff: '알림 권한이 꺼져 있어 알림을 받을 수 없어요',
	},
	general: {
		language: '앱 언어',
		korean: '한국어',
		english: 'English',
		devices: '연결된 기기',
	},
	account: {
		signOut: '로그아웃',
		withdraw: '회원 탈퇴',
	},
	support: {
		title: '지원',
		feedback: '피드백 보내기',
		notices: '공지',
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
		runningSession: '학습 진행 중',
		lastSeen: '마지막 접속 {{time}}',
		delete: '{{name}} 삭제',
		deleteMessage: '삭제하면 이 기기로 알림이 가지 않아요.',
		sessionEnds: '이 기기에서 진행 중인 학습이 종료돼요.',
		deleteError: '기기를 삭제하지 못했어요. 다시 시도해 주세요.',
	},
};
