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
			scene: "a parrot on a perch next to a tablet, and the word Hello recorded in the owner's voice",
			voiceOwner: 'Your voice',
		},
		place: {
			title: 'Before you head out, place <b>a spare device</b> by the cage and start a session.',
			scene: 'a photo of a charging tablet running a session next to a parrot on top of the cage',
			spareDevice: 'Spare device (tablet, old phone)',
			charger: 'Plug into a charger',
		},
		live: {
			title: "Check session details <b>on your phone</b> in real time, even when you're out",
			scene: 'session details on a phone: learning time, word taught, mimicked count, emergencies, and the log',
		},
		sound: {
			title: "<b>Parrot-trained AI</b> picks up your bird's chirps and the words it repeats.",
			scene: 'the sound log in session details: the mimicked word Hello, a chirp, and a distress call',
		},
		motion: {
			title: 'Moments when your parrot <b>goes out of view or comes back</b> are recorded too.',
			scene: 'the movement log in session details: a video of the parrot going out of view and a photo of it back in view',
		},
		start: 'Get started',
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
