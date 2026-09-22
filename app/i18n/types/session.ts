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
		placementHelp: string
	}
	placement: {
		start: {
			title: string
			scene: string
		}
		cycle: {
			title: string
			scene: string
		}
		mimicry: {
			title: string
			scene: string
		}
		alert: {
			title: string
			scene: string
		}
		setup: {
			title: string
			scene: string
		}
	}
	camera: {
		preview: string
		hint: string
		start: string
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
		emergency: string
		stripTitle: string
		duration: string
		plays: string
		times: string
		mimicked: string
		playBest: string
		bestCaption: string
		home: string
	}
	monitor: {
		battery: string
		charging: string
		disconnected: string
		unplugged: string
		playLive: string
		cameraOff: string
		still: string
		fullscreen: string
		changeWord: string
		applyWord: string
		changeError: string
		elapsed: string
		sounds: string
		none: string
	}
	live: {
		notReady: string
		disconnected: string
	}
}
