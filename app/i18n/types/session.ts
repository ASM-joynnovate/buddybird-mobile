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
		word: string;
		choose: string;
		duration: string;
		untilEnd: string;
		custom: string;
		days: string;
		hours: string;
		minutes: string;
		empty: string;
		addWord: string;
		elsewhere: string;
		endElsewhere: string;
		previewRecording: string;
		endElsewhereError: string;
	};
	run: {
		reveal: string;
		elapsed: string;
		keepOpen: string;
		engineError: string;
		remaining: string;
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
