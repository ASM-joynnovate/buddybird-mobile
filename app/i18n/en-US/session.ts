import type { SessionMessages } from '@/i18n/types/session';

export const session: SessionMessages = {
	takeover: {
		title: 'Start on this device?',
		message: 'The session on your other device will end and a new one starts here.',
		confirm: 'Start here',
	},
	startError: {
		title: "Couldn't start the session",
		message: 'Check your internet connection and try again.',
	},
	sleep: {
		label: 'Sleep time',
		range: '{{sleep}} ~ {{wake}}',
		sleep_at: 'Bedtime',
		wake_at: 'Wake time',
	},
	start: {
		word: 'Word',
		choose: 'Choose',
		duration: 'Learning time',
		untilEnd: 'Until I end it',
		custom: 'Set my own',
		days: 'd',
		hours: 'h',
		minutes: 'm',
		empty: 'No words to play yet. Record a word first.',
		addWord: 'Add word',
		elsewhere: 'Learning is running on another device',
		endElsewhere: 'End that session',
		previewRecording: 'Play the {{name}} recording',
		endElsewhereError: "Couldn't end the session. Check your internet connection and try again.",
	},
	run: {
		reveal: 'Tap the screen to see session info',
		elapsed: 'Session time',
		keepOpen: 'Keep the app open and the screen on until learning ends',
		engineError: "Couldn't play the word. End this session and start again.",
		remaining: '{{time}} left',
	},
	end: {
		title: 'End session',
		button: 'End',
		keep: 'Keep going',
	},
	summary: {
		word: 'Word',
		totalTime: 'Total time',
		viewDetail: 'View this session',
	},
};
