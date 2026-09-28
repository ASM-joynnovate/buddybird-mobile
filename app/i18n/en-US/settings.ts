import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Settings',
	saveError: "We couldn't save, so we restored the previous value. Please try again.",
	care: {
		title: 'Parrot care',
	},
	notifications: {
		title: 'Notifications',
		notice: 'Notice alerts',
		report: 'Report alerts',
		marketing: 'Marketing alerts',
		permissionOff: "Notifications are off, so you won't get alerts",
		permissionLink: 'Turn on in Permissions',
	},
	general: {
		title: 'General',
		language: 'App language',
		korean: '한국어',
		english: 'English',
		devices: 'Connected devices',
		permissions: 'Permissions',
	},
	account: {
		title: 'Account',
		signOut: 'Sign out',
		withdraw: 'Delete account',
	},
	support: {
		title: 'Support',
		feedback: 'Send feedback',
		notices: 'Notices',
		unreadNotice: 'You have unread notices',
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
	notices: {
		title: 'Notices',
		empty: 'No notices right now',
		unread: 'Unread',
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
	},
	permissions: {
		title: 'Permissions',
		granted: 'Allowed',
		denied: 'Not allowed',
		checking: 'Checking',
	},
};
