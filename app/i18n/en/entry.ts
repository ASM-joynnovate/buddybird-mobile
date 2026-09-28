import type { EntryMessages } from '@/i18n/types/entry';

export const entry: EntryMessages = {
	login: {
		product: 'BuddyBird',
	},
	consent: {
		intro: 'Please agree to use the BuddyBird app!',
		all: 'Agree to all',
		required: 'Required',
		optional: 'Optional',
		viewFull: 'Read {{title}}',
	},
	consentDetail: {
		agree: 'Agree',
	},
	parrot: {
		intro: 'Tell me about your parrot!',
		addTitle: 'Add parrot',
		editTitle: 'Edit parrot',
		register: 'Add',
		delete: 'Delete parrot',
		deleteError: "We couldn't delete the parrot. Please try again.",
		photoType: 'Only JPEG or PNG photos work. Please choose another photo.',
		photoSize: 'Photos must be 5MB or smaller. Please choose another photo.',
		photoError: "We couldn't load the photo. Please choose it again.",
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
		title: 'Permissions BuddyBird needs',
		scene: 'Buddy explaining permissions',
		microphone: "Record words and your parrot's sounds",
		notifications: 'Learning alerts',
		allow: 'Allow',
		later: 'Later',
	},
	legacy: {
		uploading: 'Moving the parrot and words on this phone',
		error: "We couldn't move your parrot and words. Check your connection and try again.",
		askTitle: 'Add the parrot and words on this phone?',
		add: 'Add',
		skip: 'Skip',
	},
};
