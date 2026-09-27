export type ReportMessages = {
	title: string
	periods: {
		day: string
		week: string
		month: string
	}
	previous: string
	next: string
	learningTime: string
	bar: string
	hour: string
	words: string
	sessions: string
	sounds: string
	mimicry: string
	judging: string
	empty: string
	emptyScene: string
	startSession: string
	detail: {
		judging: string
		none: string
	}
}
