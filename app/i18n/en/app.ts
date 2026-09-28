import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'Getting the app ready',
		title: "Couldn't start the app",
		message: 'Check your internet connection and try again.',
	},
	feedback: {
		thanks: 'Your feedback came through. We will use it to make BuddyBird better.',
		thanksClose: 'Done',
		retry: 'Try again',
		promptTitle: 'Tell us what you think',
		promptMessage: 'Share anything you love or wish were different about BuddyBird. It really helps!',
		later: 'Close',
		write: 'Give feedback',
		title: 'Send feedback',
		placeholder: 'Tell us what to improve, what feels off, or a feature you wish existed.',
		privacy: '⚠ Please do not include personal info like your name or contact details.',
		send: 'Send',
		sent: 'Thank you!',
		error: "Couldn't send your feedback. Your message is kept; check your connection and try again.",
	},
	update: {
		title: 'Update available',
		required: 'Update needed',
		body: 'BuddyBird {{version}} is available.',
		requiredBody: 'Update to {{version}} to keep using BuddyBird.',
		accept: 'Update',
		later: 'Close',
		openStoreError: "Couldn't open the store. Please try again.",
	},
};
