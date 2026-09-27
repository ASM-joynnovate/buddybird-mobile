import type { ReportMessages } from "@/i18n/types/report"

export const report: ReportMessages = {
	title: "리포트",
	periods: {
		day: "오늘",
		week: "이번 주",
		month: "이번 달",
	},
	previous: "이전 기간",
	next: "다음 기간",
	learningTime: "학습 시간",
	bar: "{{label}}, {{duration}}",
	hour: "{{hour}}시",
	words: "단어별 학습 시간",
	sessions: "학습 목록",
	sounds: "앵무새가 따라 한 소리",
	mimicry: "{{count}}번 따라 함",
	judging: "판정 중",
	empty: "이 기간에는 학습 기록이 없어요",
	emptyScene: "빈 리포트",
	startSession: "세션 시작하기",
	detail: {
		judging: "앵무새가 따라 한 소리를 확인하고 있어요. 화면을 아래로 당기면 새로 불러와요.",
		none: "이 학습에서 앵무새가 따라 한 소리가 없어요.",
	},
}
