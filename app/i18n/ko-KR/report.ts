import type { ReportMessages } from '@/i18n/types/report';

export const report: ReportMessages = {
	title: '리포트',
	unit: '기간 단위',
	units: {
		day: '일간',
		week: '주간',
		month: '월간',
	},
	periods: {
		day: '오늘',
		week: '이번 주',
		month: '이번 달',
	},
	selectedPeriod: '이 기간',
	previousPeriods: {
		day: '어제',
		week: '지난주',
		month: '지난달',
	},
	comparedTo: {
		day: '어제 대비',
		week: '지난주 대비',
		month: '지난달 대비',
	},
	change: {
		day: '어제 대비 {{change}}',
		week: '지난주 대비 {{change}}',
		month: '지난달 대비 {{change}}',
	},
	noChange: '변동 없음',
	previous: '이전 기간',
	next: '다음 기간',
	chartHour: '{{hour}}시',
	chartLabel: '{{period}} 누적 학습 시간 {{duration}}, {{previousPeriod}} {{previousDuration}}',
	until: '{{label}}까지',
	bucketDuration: '{{duration}} 학습',
	learningTimeByWord: '단어별 학습 시간',
	sessions: '학습 목록',
	judging: '분석 중',
	empty: '이 기간에는 학습 기록이 없어요',
	detail: {
		judging: '앵무새가 따라 한 소리를 확인하고 있어요. 화면을 아래로 당기면 새로 불러와요.',
		empty: '이 학습에서 앵무새가 따라 한 소리가 없어요.',
		playSound: '{{time}}에 감지한 소리 재생',
		soundExpired: '보관 기간이 지나 들을 수 없어요',
		shareError: '소리를 공유하지 못했어요. 다시 시도해 주세요.',
		shareHint: '길게 누르면 소리를 공유할 수 있어요',
	},
	signInRequired: '로그인하면 앵무새가 따라 한 소리를 볼 수 있어요',
};
