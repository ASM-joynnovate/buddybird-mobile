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
	chartHour: string;
	chartLabel: string;
	until: string;
	bucketDuration: string;
	learningTimeByWord: string;
	sessions: string;
	judging: string;
	empty: string;
	detail: {
		judging: string;
		empty: string;
		playSound: string;
		soundExpired: string;
		shareError: string;
		shareHint: string;
	};
	signInRequired: string;
};
