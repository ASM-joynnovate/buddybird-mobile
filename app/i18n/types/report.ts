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
		title: string;
		learningTime: string;
		taughtWord: string;
		mimicCount: string;
		mimicCountValue_one: string;
		mimicCountValue_few: string;
		mimicCountValue_many: string;
		mimicCountValue_other: string;
		emergencyCount: string;
		emergencyCountValue_one: string;
		emergencyCountValue_few: string;
		emergencyCountValue_many: string;
		emergencyCountValue_other: string;
		kinds: {
			parrot: string;
			distressCall: string;
			parrotDisappeared: string;
			parrotAppeared: string;
		};
		mediaTypes: {
			audio: string;
			video: string;
			image: string;
		};
		sessionLog: string;
		timeRange: string;
		timeFrom: string;
		share: string;
		shareButton: string;
		percent: string;
		filePending: string;
		fileRejected: string;
		shareError: string;
	};
};
