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
		saveError: string
	}
	start: {
		title: string
		wordLabel: string
		learning: string
		empty: string
		emptyScene: string
		addWord: string
	}
	run: {
		reveal: string
		online: string
		offline: string
		batteryUnknown: string
		micOn: string
		micOff: string
		cameraOn: string
		cameraOff: string
		word: string
		elapsed: string
		noWord: string
		learningOff: string
	}
	end: {
		title: string
		button: string
		confirm: string
		keep: string
		viewerMessage: string
		error: string
	}
	summary: {
		greeting: string
		greetingNoName: string
		stripTitle: string
		duration: string
		plays: string
		times: string
		mimicked: string
		playBest: string
		bestCaption: string
		home: string
	}
}
