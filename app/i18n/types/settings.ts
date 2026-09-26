export type SettingsMessages = {
	title: string
	saveError: string
	care: {
		title: string
		sleep: string
		wake: string
		hour: string
		minute: string
		hourPicker: string
		minutePicker: string
	}
	notifications: {
		title: string
		emergency: string
		mimicry: string
		dailySummary: string
		streak: string
		stationDisconnect: string
		permissionOff: string
		permissionLink: string
	}
	general: {
		title: string
		language: string
		korean: string
		english: string
		languageError: string
		devices: string
		permissions: string
	}
	account: {
		title: string
		signOut: string
		withdraw: string
	}
	support: {
		title: string
		feedback: string
		notices: string
		unreadNotice: string
		consents: string
		version: string
	}
	signOutDialog: {
		title: string
		message: string
		confirm: string
	}
	withdrawDialog: {
		title: string
		message: string
		line: string
		confirm: string
	}
	notices: {
		title: string
		empty: string
		unread: string
	}
	consents: {
		title: string
		saveError: string
	}
	devices: {
		title: string
		current: string
		running: string
		lastSeen: string
		rename: string
		renameTitle: string
		nameLabel: string
		renameError: string
		disconnect: string
		disconnectMessage: string
		sessionEnds: string
		disconnectConfirm: string
		disconnectError: string
	}
	permissions: {
		title: string
		granted: string
		denied: string
		checking: string
	}
}
