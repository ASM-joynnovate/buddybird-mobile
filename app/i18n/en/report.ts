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
	playTime: "Play time",
	playCount: "Plays: {{count}}",
	bar: "{{label}}, {{duration}}",
	hour: "{{hour}}h",
	words: "Plays by word",
	count: "{{count}}",
	sounds: "Parrot sounds",
	mimicry: "Mimicked",
	noSounds: "No parrot sounds in this period",
	empty: "No learning records in this period",
	emptyScene: "an empty report",
	startSession: "Start a session",
}
