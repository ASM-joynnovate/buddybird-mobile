import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: '집을 비운 동안에도 앵무새가 말을 배워요',
		greeting: {
			title: '반가워요!',
			body: '로그인하고 함께 시작해요',
		},
		words: ['안녕', '사랑해', '좋은 아침', '밥 먹자', '예쁘다'],
	},
	consent: {
		intro: '버디버드 앱 사용을 위해 동의해주세요!',
		all: '모두 동의',
	},
	usage: {
		record: {
			title: '앵무새에게 가르칠 단어를 <b>내 목소리</b>로 녹음해요',
			scene: '태블릿 옆 횃대에 앉은 앵무새와 보호자 목소리로 녹음한 단어 안녕',
			voiceOwner: '보호자 목소리',
		},
		place: {
			title: '외출 전, <b>안 쓰는 기기</b>를 새장에 두고 학습을 시작해요',
			scene: '충전기에 연결한 태블릿이 새장 위 앵무새 옆에서 학습 중인 사진',
			spareDevice: '안 쓰는 기기(태블릿, 공기계)',
			charger: '충전기에 연결',
		},
		live: {
			title: '밖에서도 <b>내 폰</b>으로 학습 상세를 실시간으로 확인해요',
			scene: '휴대폰에 보이는 학습 상세. 학습 시간, 가르친 단어, 따라 한 횟수, 응급 상황과 기록',
		},
		sound: {
			title: '<b>앵무새 특화 AI</b>가 우리 앵이의 짹짹, 따라 한 말을 감지해 보여 줘요',
			scene: '학습 상세의 소리 기록. 짹짹, 따라 한 말 안녕, 신경질적 짹짹',
		},
		motion: {
			title: '앵무새가 <b>사라지거나 나타난 순간</b>도 기록돼요',
			scene: '학습 상세의 움직임 기록. 앵무새 사라짐 동영상과 앵무새 나타남 사진',
		},
		start: '시작하기',
	},
	permissions: {
		intro: '버디버드에 필요한 권한이에요',
		scene: '새장 앞 휴대폰이 앵무새 소리를 듣고 알림을 보내는 장면',
		buddyWord: '안녕!',
		listening: '소리 듣는 중',
		alert: {
			appName: '버디버드',
			time: '지금',
			message: '학습을 마쳤어요',
		},
		purpose: {
			microphone: '단어 녹음과 앵무새 소리 기록',
			notifications: '학습 소식 알림',
		},
		continue: '계속',
	},
	marketing: {
		intro: '새 기능과 이벤트 소식을 알림으로 받아 볼까요?',
		scene: '횃대 위 버디와 벽에 붙은 새 소식',
		news: {
			features: '새 기능',
			events: '이벤트',
		},
		hint: '설정의 알림에서 언제든 바꿀 수 있어요.',
		night: '밤 9시~아침 8시에도 받기',
		accept: '받을게요',
		decline: '괜찮아요',
	},
	legacy: {
		uploading: '이 휴대폰의 앵무새와 단어를 옮기고 있어요',
		uploadError: '앵무새와 단어를 옮기지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
		askTitle: '이 휴대폰의 앵무새와 단어를 추가할까요?',
	},
};
