import type { ReportMessages } from "@/i18n/types/report"

export const report: ReportMessages = {
	title: "Report",
	periods: {
		day: "Today",
		week: "This week",
		month: "This month",
	},
	previous: "Previous period",
	next: "Next period",
	learningTime: "Learning time",
	bar: "{{label}}, {{duration}}",
	hour: "{{hour}}h",
	words: "Learning time by word",
	sessions: "Sessions",
	sounds: "Parrot mimicry",
	mimicry: "Mimicked {{count}}",
	judging: "Checking",
	empty: "No learning records in this period",
	emptyScene: "an empty report",
	startSession: "Start a session",
	detail: {
		judging: "Checking which sounds your parrot mimicked. Pull down to refresh.",
		none: "Your parrot didn't mimic any words in this session.",
	},
}
