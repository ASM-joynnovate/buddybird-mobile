import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'Getting the app ready',
	},
	startupError: {
		title: "Couldn't start the app",
		message: 'Check your internet connection and try again.',
	},
	feedback: {
		sentMessage: 'Your feedback came through. We will use it to make BuddyBird better.',
		retry: 'Retry',
		promptTitle: 'Tell us what you think',
		promptMessage: 'Share anything you love or wish were different about BuddyBird. It really helps!',
		write: 'Feedback',
		title: 'Send feedback',
		placeholder: 'Tell us what to improve, what feels off, or a feature you wish existed.',
		privacy: '⚠ Please do not include personal info like your name or contact details.',
		send: 'Send',
		sentTitle: 'Thank you!',
		sendError: "Couldn't send your feedback. Your message is kept; check your connection and try again.",
	},
	update: {
		title: 'Update available',
		forcedTitle: 'Update needed',
		message: 'BuddyBird {{version}} is available.',
		forcedMessage: 'Update to {{version}} to keep using BuddyBird.',
		accept: 'Update',
		openStoreError: "Couldn't open the store. Please try again.",
	},
};
