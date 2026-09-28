import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		product: '버디버드',
	},
	consent: {
		intro: '버디버드 앱 사용을 위해 동의해주세요!',
		all: '모두 동의',
	},
	usage: {
		record: {
			title: '앵무새에게 가르칠 단어를 내 목소리로 녹음해요',
			scene: '마이크에 단어를 녹음하는 사람과 버디',
		},
		place: {
			title: '휴대폰을 새장 앞에 두고 시작을 누르면 앵무새에게 단어를 들려줘요',
			scene: '새장 앞에 세워 둔 휴대폰',
		},
		keepOn: {
			title: '학습하는 동안에는 앱을 켜 두고 화면을 끄지 마세요',
			scene: '화면이 켜진 채 새장 앞에 놓인 휴대폰',
		},
		report: {
			title: '리포트에서 학습한 시간과 기록을 확인해요',
			scene: '휴대폰으로 학습 리포트를 보는 사람',
		},
	},
	permissions: {
		intro: '버디버드에 필요한 권한이에요',
		scene: '권한을 설명하는 버디',
		purpose: {
			microphone: '단어 녹음과 앵무새 소리 기록',
			notifications: '학습 소식 알림',
		},
		allow: '허용하기',
		later: '나중에',
	},
	legacy: {
		uploading: '이 휴대폰의 앵무새와 단어를 옮기고 있어요',
		uploadError: '앵무새와 단어를 옮기지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
		askTitle: '이 휴대폰의 앵무새와 단어를 추가할까요?',
	},
};
