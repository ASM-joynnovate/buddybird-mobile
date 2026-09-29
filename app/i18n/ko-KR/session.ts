import type { SessionMessages } from '@/i18n/types/session';

export const session: SessionMessages = {
	takeover: {
		title: '이 기기에서 시작할까요?',
		message: '다른 기기에서 실행 중인 세션을 끝내고 이 기기에서 새로 시작해요.',
		confirm: '이 기기에서 시작',
	},
	startError: {
		title: '세션을 시작하지 못했어요',
		message: '인터넷 연결을 확인하고 다시 시도해 주세요.',
	},
	sleep: {
		label: '수면 시간',
		range: '{{sleep}} ~ {{wake}}',
		sleep_at: '취침 시각',
		wake_at: '기상 시각',
	},
	start: {
		title: '학습',
		word: '단어',
		selectWord: '{{name}} 선택',
		duration: '학습 시간',
		untilEnd: '끝낼 때까지',
		untilEndHint: '학습 화면에서 끝낼 때까지 계속해요',
		presetHints: {
			short: '샤워하거나 잠시 자리를 비울 때',
			medium: '짧은 외출로 자리를 비울 때',
			long: '여행 등으로 인해 길게 자리를 비울 때',
		},
		custom: '직접 설정',
		customHint: '원하는 시간을 직접 정해요',
		total: '총 학습 시간',
		days: '일',
		hours: '시간',
		minutes: '분',
		invalid: '학습 시간을 1분 이상으로 설정해 주세요.',
		empty: '들려줄 단어가 없어요. 단어를 녹음해 주세요.',
		startButton: '학습 시작',
		startUnavailable: '학습할 단어와 시간을 설정하면 시작할 수 있어요',
		elsewhere: '다른 기기에서 학습 중이에요',
		endElsewhere: '그 학습 끝내기',
		endElsewhereError: '세션을 끝내지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
	},
	run: {
		reveal: '화면을 누르면 세션 정보가 보여요',
		elapsed: '세션 경과',
		keepOpen: '학습이 끝날 때까지 앱을 켜 두고 화면을 끄지 마세요',
		engineError: '소리를 재생하지 못했어요. 학습을 끝내고 다시 시작해 주세요.',
		remaining: '{{time}} 남음',
	},
	end: {
		title: '세션 종료',
		button: '종료',
		keep: '계속',
	},
	summary: {
		word: '단어',
		totalTime: '전체 시간',
		viewDetail: '이 학습 기록 보기',
	},
};
