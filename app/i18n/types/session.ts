export type SessionMessages = {
	takeover: {
		title: string;
		message: string;
		confirm: string;
	};
	startError: {
		title: string;
		message: string;
	};
	sleep: {
		label: string;
		range: string;
		sleep_at: string;
		wake_at: string;
	};
	start: {
		title: string;
		word: string;
		selectWord: string;
		duration: string;
		untilEnd: string;
		untilEndHint: string;
		presetHints: {
			short: string;
			medium: string;
			long: string;
		};
		custom: string;
		customHint: string;
		total: string;
		days: string;
		hours: string;
		minutes: string;
		invalid: string;
		empty: string;
		startButton: string;
		startUnavailable: string;
		elsewhere: string;
		endElsewhere: string;
		endElsewhereError: string;
	};
	run: {
		reveal: string;
		elapsed: string;
		keepOpen: string;
		dimAfter: string;
		engineError: string;
		remaining: string;
		battery: string;
		batteryLevel: string;
		charging: string;
	};
	end: {
		title: string;
		button: string;
		keep: string;
	};
	summary: {
		word: string;
		totalTime: string;
		viewDetail: string;
	};
};
