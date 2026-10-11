export type ReportMessages = {
	title: string;
	unit: string;
	units: {
		day: string;
		week: string;
		month: string;
	};
	periods: {
		day: string;
		week: string;
		month: string;
	};
	selectedPeriod: string;
	previousPeriods: {
		day: string;
		week: string;
		month: string;
	};
	comparedTo: {
		day: string;
		week: string;
		month: string;
	};
	change: {
		day: string;
		week: string;
		month: string;
	};
	noChange: string;
	previous: string;
	next: string;
	today: string;
	chartHour: string;
	chartLabel: string;
	until: string;
	dateRange: string;
	bucketDuration: string;
	learningTimeByWord: string;
	sessions: string;
	judging: string;
	empty: string;
	detail: {
		period: string;
		now: string;
		overview: string;
		learningTime: string;
		playCount: string;
		detected: string;
		kinds: {
			parrot: string;
			mimic: string;
			emergency: string;
		};
		myVoice: string;
		firstRecording: string;
		noMimic: string;
		soundAt: string;
		playMyVoice: string;
		previous: string;
		next: string;
		tapeLog: string;
		start: string;
		end: string;
		hour: string;
		timeRange: string;
		play: string;
		share: string;
		scores: {
			parrot: string;
			mimic: string;
		};
		percent: string;
		shareError: string;
	};
};
