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
	playTime: "들려준 시간",
	playCount: "{{count}}번 재생",
	bar: "{{label}}, {{duration}}",
	hour: "{{hour}}시",
	words: "단어별 재생 횟수",
	count: "{{count}}번",
	sounds: "앵무새 발성",
	mimicry: "따라 한 횟수",
	noSounds: "이 기간에 기록된 앵무새 발성이 없어요",
	empty: "이 기간에는 학습 기록이 없어요",
	emptyScene: "빈 리포트",
	startSession: "세션 시작하기",
}
