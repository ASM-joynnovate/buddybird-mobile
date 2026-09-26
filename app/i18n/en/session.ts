import type { SessionMessages } from "@/i18n/types/session"

export const session: SessionMessages = {
	remaining: "{{left}} left",
	untilWake: "{{left}} until wake at {{time}}",
	takeover: {
		title: "Start on this device?",
		message: "The session on your other device will end and a new one starts here.",
		confirm: "Start here",
	},
	startError: {
		title: "Couldn't start the session",
		message: "Check your internet connection and try again.",
	},
	words: {
		needsRecording: "Needs recording",
		preview: "Play the {{name}} recording",
	},
	sleep: {
		label: "Sleep time",
		range: "{{sleep}} ~ {{wake}}",
		sleep_at: "Bedtime",
		wake_at: "Wake time",
	},
	start: {
		word: "Word",
		choose: "Choose",
		duration: "Learning time",
		untilEnd: "Until I end it",
		custom: "Set my own",
		days: "d",
		hours: "h",
		minutes: "m",
		empty: "No words to play yet. Record a word first.",
		addWord: "Add word",
		elsewhere: "Learning is running on another device",
		endElsewhere: "End that session",
	},
	run: {
		reveal: "Tap the screen to see session info",
		elapsed: "Session time",
		keepOpen: "Keep this app open until learning ends",
		engineError: "Couldn't play the word. End this session and start again.",
	},
	end: {
		title: "End session",
		button: "End",
		confirm: "End",
		keep: "Keep going",
		error: "Couldn't end the session. Check your internet connection and try again.",
	},
	summary: {
		word: "Word",
		learning: "Learning time",
		total: "Total time",
		detail: "View this session",
	},
}
