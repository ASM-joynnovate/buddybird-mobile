import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: "Your parrot keeps learning while you're away",
		greeting: {
			title: 'Nice to meet you!',
			body: "Log in and let's get started",
		},
		words: ['Hello', 'Love you', 'Good morning', "Let's eat", 'Pretty bird'],
	},
	consent: {
		intro: 'Please agree to use the BuddyBird app!',
		all: 'Agree to all',
	},
	usage: {
		record: {
			title: 'Record the words to teach your parrot in your own voice',
			scene: 'a person recording a word into a microphone with Buddy',
		},
		place: {
			title: 'Place your phone by the cage and press Start to play words to your parrot',
			scene: 'a phone standing by the cage',
		},
		keepOn: {
			title: 'Keep the app open and the screen on while learning',
			scene: 'a phone by the cage with its screen on',
		},
		report: {
			title: 'Check your learning time and records in Report',
			scene: 'a person viewing the learning report on a phone',
		},
	},
	permissions: {
		intro: 'Permissions BuddyBird needs',
		scene: 'Buddy explaining permissions',
		purpose: {
			microphone: "Record words and your parrot's sounds",
			notifications: 'Learning alerts',
		},
		allow: 'Allow',
		later: 'Later',
	},
	marketing: {
		intro: 'Want news about new features and events?',
		scene: 'Buddy sharing news',
		hint: 'You can change this anytime in Settings > Notifications.',
		accept: 'Yes, notify me',
		decline: 'No thanks',
	},
	legacy: {
		uploading: 'Moving the parrot and words on this phone',
		uploadError: "We couldn't move your parrot and words. Check your connection and try again.",
		askTitle: 'Add the parrot and words on this phone?',
	},
};
