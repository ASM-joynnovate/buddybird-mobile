import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Settings',
	saveError: "We couldn't save, so we restored the previous value. Please try again.",
	notifications: {
		title: 'Notifications',
		all: 'All notifications',
		announcement: 'Announcement alerts',
		report: 'Report alerts',
		marketing: 'Marketing alerts',
		marketingNight: 'Night marketing alerts',
		marketingNightHours: '9 PM to 8 AM',
		permissionOff: "Notifications are off, so you won't get alerts",
	},
	general: {
		language: 'App language',
		korean: '한국어',
		english: 'English',
		devices: 'Connected devices',
	},
	account: {
		signOut: 'Sign out',
		withdraw: 'Delete account',
	},
	support: {
		title: 'Support',
		feedback: 'Send feedback',
		consents: 'Terms and consents',
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
