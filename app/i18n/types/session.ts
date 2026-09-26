export type SessionMessages = {
	remaining: string
	untilWake: string
	takeover: {
		title: string
		message: string
		confirm: string
	}
	startError: {
		title: string
		message: string
	}
	words: {
		needsRecording: string
		preview: string
	}
	sleep: {
		label: string
		range: string
		sleep_at: string
		wake_at: string
	}
	start: {
		word: string
		choose: string
		duration: string
		untilEnd: string
		custom: string
		days: string
		hours: string
		minutes: string
		empty: string
		addWord: string
		elsewhere: string
		endElsewhere: string
	}
	run: {
		reveal: string
		elapsed: string
		keepOpen: string
	}
	end: {
		title: string
		button: string
		confirm: string
		keep: string
		error: string
	}
	summary: {
		word: string
		learning: string
		total: string
		detail: string
	}
}
