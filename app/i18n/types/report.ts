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
	noSounds: string
	empty: string
	emptyScene: string
	startSession: string
	detail: {
		plays: string
		mimicry: string
		times: string
		filters: {
			all: string
			sounds: string
			connection: string
		}
		empty: string
		serverEnded: string
		events: {
			session_started: string
			learning_started: string
			learning_finished: string
			sleep_started: string
			sleep_finished: string
			station_disconnected: string
			station_reconnected: string
			session_finished: string
		}
	}
}
