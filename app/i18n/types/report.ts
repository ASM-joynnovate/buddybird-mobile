export type ReportMessages = {
	title: string;
	periods: {
		day: string;
		week: string;
		month: string;
	};
	previous: string;
	next: string;
	learningTime: string;
	chartBar: string;
	chartHour: string;
	learningTimeByWord: string;
	sessions: string;
	judging: string;
	empty: string;
	emptyScene: string;
	startSession: string;
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
