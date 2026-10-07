import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: "Your parrot keeps learning while you're away",
		greeting: {
			title: 'Nice to meet you!',
			body: "Sign in and let's get started",
		},
		words: ['Hello', 'Love you', 'Good morning', "Let's eat", 'Pretty bird'],
	},
	consent: {
		intro: 'Please agree to the terms to get started!',
		all: 'Agree to all',
	},
	usage: {
		record: {
			title: 'Record the words to teach your parrot in <b>your own voice</b>',
			scene: 'a word being recorded and a microphone',
			recording: 'Recording',
		},
		place: {
			title: 'Place your phone <b>by the cage</b> and tap Start',
			scene: 'a phone by the cage playing a word to the parrot',
		},
		keepOn: {
			title: 'Keep the app open and <b>the screen on</b> while learning',
			scene: 'a charging phone by the cage with its screen on in a dark room',
		},
		report: {
			title: 'Check your learning time and records in <b>Report</b>',
			scene: 'a report comparing this week with last week',
			lastWeek: 'Last week',
			comparedToLastWeek: '+{{duration}} vs last week',
		},
	},
	permissions: {
		intro: 'Permissions BuddyBird needs',
		scene: 'a phone by the cage hearing the parrot and sending an alert',
		buddyWord: 'Hello!',
		listening: 'Listening',
		alert: {
			appName: 'BuddyBird',
			time: 'now',
			message: 'Learning finished',
		},
		purpose: {
			microphone: 'Record words and parrot sounds',
			notifications: 'Learning alerts',
		},
		continue: 'Continue',
	},
	marketing: {
		intro: 'Want news about new features and events?',
		scene: 'Buddy on a perch with news pinned to the wall',
		news: {
			features: 'New features',
			events: 'Events',
		},
		hint: 'You can change this anytime in Settings > Notifications.',
		night: 'Also notify me from 9 PM to 8 AM',
		accept: 'Notify me',
		decline: 'No thanks',
	},
	legacy: {
		uploading: 'Moving the parrot and words on this phone',
		uploadError: "We couldn't move your parrot and words. Check your connection and try again.",
		askTitle: 'Add the parrot and words on this phone?',
	},
};
