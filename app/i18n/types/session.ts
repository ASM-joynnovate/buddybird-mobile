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
	lowVolume: {
		title: string;
		message: string;
		confirm: string;
	};
	sleep: {
		label: string;
		description: string;
		range: string;
		bedtime: string;
		wakeTime: string;
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
		watch: string;
	};
	run: {
		reveal: string;
		camera: string;
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
		message: string;
		button: string;
		keep: string;
	};
	watch: {
		leave: string;
		connecting: string;
		cameraOff: { title: string; message: string };
		zoomHint: { title: string; message: string };
		zoomLevel: string;
	};
	summary: {
		title: string;
		range: string;
		parrots: string;
		together: { lead: string; tail: string };
		played: { lead: string; tail: string };
		wordTime: { lead: string; tail: string };
		allTime: { lead: string; tail: string };
		count_one: string;
		count_few: string;
		count_many: string;
		count_other: string;
		sentenceProgress: string;
		playCount: string;
		totalTime: string;
		wordTotal: string;
		allTotal: string;
		added: string;
		goHome: string;
		viewDetail: string;
	};
};
