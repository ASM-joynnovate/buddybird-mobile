import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Settings',
	saveError: "We couldn't save, so we restored the previous value.\nPlease try again.",
	notifications: {
		title: 'Notifications',
		all: 'All notifications',
		permissionOff: "Notifications are off, so you won't get alerts",
	},
	general: {
		title: 'General',
		languageAndCountry: 'Language and country',
		language: 'App language',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		country: 'Country',
		countryChoose: 'Select',
		countrySearchHint: 'Search countries',
		countrySearchClear: 'Clear search',
		countryNotFound: 'No countries match “{{query}}”',
		devices: 'Connected devices',
	},
	privacy: {
		title: 'Privacy',
		feed: 'Show on the feed',
		feedDetail: 'Others can see your learning records and mimicked sounds',
		leaderboard: 'Join the leaderboard',
		leaderboardDetail: 'Others can see your nickname, photo, and learning time',
		consents: 'Terms and consents',
	},
	account: {
		signOut: 'Sign out',
		withdraw: 'Delete account',
	},
	support: {
		title: 'Support',
		feedback: 'Send feedback',
		version: 'App version {{version}}',
	},
	signOutDialog: {
		title: 'Sign out',
		message: 'Sign out on this device?',
		confirm: 'Sign out',
	},
	withdrawDialog: {
		title: 'Delete account',
		message: 'Buddy will miss you. Do you really want to leave?',
		warning: "This can't be undone.",
		confirm: 'Delete account',
	},
	consents: {
		title: 'Terms and consents',
		saveError: "We couldn't save your choice. Please try again.",
	},
	devices: {
		title: 'Connected devices',
		thisDevice: 'This device',
		runningSession: 'Session running',
		lastSeen: 'Last seen {{time}}',
		delete: 'Delete {{name}}',
		deleteMessage: 'This device will stop getting notifications.',
		sessionEnds: 'The session running on this device will end.',
		deleteError: "We couldn't delete the device. Please try again.",
	},
};
