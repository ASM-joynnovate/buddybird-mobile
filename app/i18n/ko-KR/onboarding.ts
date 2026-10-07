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
			scene: '녹음 중인 단어와 마이크',
			recording: '녹음 중',
		},
		place: {
			title: '휴대폰을 <b>새장 앞</b>에 두고 시작을 누르면 앵무새에게 단어를 들려줘요',
			scene: '새장 앞에 세운 휴대폰이 앵무새에게 단어를 들려주는 장면',
		},
		keepOn: {
			title: '학습하는 동안에는 앱을 켜 두고 <b>화면을 끄지 마세요</b>',
			scene: '어두운 방에서 화면을 켠 채 충전하는 휴대폰',
		},
		report: {
			title: '<b>리포트</b>에서 학습한 시간과 기록을 확인해요',
			scene: '이번 주와 지난주 학습 시간을 비교하는 리포트',
			lastWeek: '지난주',
			comparedToLastWeek: '지난주 대비 +{{duration}}',
		},
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
