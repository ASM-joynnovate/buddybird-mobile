import type { ReportMessages } from '@/i18n/types/report';

export const report: ReportMessages = {
	title: 'Report',
	periods: {
		day: 'Today',
		week: 'This week',
		month: 'This month',
	},
	previous: 'Previous period',
	next: 'Next period',
	learningTime: 'Learning time',
	chartBar: '{{label}}, {{duration}}',
	chartHour: '{{hour}}h',
	learningTimeByWord: 'Learning time by word',
	sessions: 'Sessions',
	judging: 'Checking',
	empty: 'No learning records in this period',
	emptyScene: 'an empty report',
	startSession: 'Start a session',
	detail: {
		judging: 'Checking which sounds your parrot mimicked. Pull down to refresh.',
		empty: "Your parrot didn't mimic any words in this session.",
		playSound: 'Play sound detected at {{time}}',
		soundExpired: 'This sound is past its storage period',
		shareError: "We couldn't share the sound. Please try again.",
		shareHint: 'Long press to share the sound',
	},
	signInRequired: 'Log in to see the sounds your parrot mimicked',
};
