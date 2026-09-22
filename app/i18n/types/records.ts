export type RecordsMessages = {
	title: string
	prevMonth: string
	nextMonth: string
	weekdays: string
	calendar: {
		today: string
		hasSession: string
		hasEmergency: string
	}
	ruler: {
		label: string
		bar: string
		hour: string
	}
	empty: string
	card: {
		learningOff: string
		now: string
		mimicry: string
		emergency: string
	}
	detail: {
		plays: string
		mimicry: string
		emergency: string
		times: string
		cases: string
		filters: {
			all: string
			sounds: string
			emergencies: string
			connection: string
		}
		empty: string
		serverEnded: string
		openEmergency: string
		events: {
			session_started: string
			learning_started: string
			learningOn: string
			learningOff: string
			word_changed: string
			sleep_started: string
			sleep_finished: string
			station_disconnected: string
			station_reconnected: string
			emergency_detected: string
			session_finished: string
		}
	}
	emergency: {
		title: string
		download: string
		delete: string
		deleteName: string
		deleteError: string
		downloadError: string
		deleted: string
		videoPending: string
		noMedia: string
		play: string
		stop: string
		playError: string
		detectedAt: string
		watchNow: string
	}
}
