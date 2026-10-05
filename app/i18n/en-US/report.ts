import type { ReportMessages } from '@/i18n/types/report';

export const report: ReportMessages = {
	title: 'Report',
	unit: 'Period',
	units: {
		day: 'Daily',
		week: 'Weekly',
		month: 'Monthly',
	},
	periods: {
		day: 'Today',
		week: 'This week',
		month: 'This month',
	},
	selectedPeriod: 'This period',
	previousPeriods: {
		day: 'Yesterday',
		week: 'Last week',
		month: 'Last month',
	},
	comparedTo: {
		day: 'vs yesterday',
		week: 'vs last week',
		month: 'vs last month',
	},
	change: {
		day: '{{change}} vs yesterday',
		week: '{{change}} vs last week',
		month: '{{change}} vs last month',
	},
	noChange: 'No change',
	previous: 'Previous period',
	next: 'Next period',
	today: 'Go to today',
	chartHour: '{{hour}}h',
	chartLabel: '{{period}} cumulative learning time {{duration}}, {{previousPeriod}} {{previousDuration}}',
	until: 'Through {{label}}',
	dateRange: '{{start}} ~ {{end}}',
	bucketDuration: '{{duration}} learned',
	learningTimeByWord: 'Learning time by word',
	sessions: 'Sessions',
	judging: 'Analyzing',
	empty: 'No learning records in this period',
	detail: {
		judging: 'Checking which sounds your parrot mimicked.\nPull down to refresh.',
		empty: 'No sounds were detected during this session.',
		playSound: 'Play sound detected at {{time}}',
		soundExpired: 'This sound is past its storage period',
		shareError: "We couldn't share the sound. Please try again.",
		shareHint: 'Long press to share the sound',
	},
};
