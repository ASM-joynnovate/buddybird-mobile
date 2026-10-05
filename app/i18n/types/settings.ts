export type SettingsMessages = {
	title: string;
	saveError: string;
	notifications: {
		title: string;
		all: string;
		announcement: string;
		report: string;
		marketing: string;
		marketingNight: string;
		marketingNightHours: string;
		permissionOff: string;
	};
	general: {
		language: string;
		korean: string;
		english: string;
		devices: string;
	};
	account: {
		signOut: string;
		withdraw: string;
	};
	support: {
		title: string;
		feedback: string;
		consents: string;
		version: string;
	};
	signOutDialog: {
		title: string;
		message: string;
		confirm: string;
	};
	withdrawDialog: {
		title: string;
		message: string;
		warning: string;
		confirm: string;
	};
	consents: {
		title: string;
		saveError: string;
	};
	devices: {
		title: string;
		thisDevice: string;
		runningSession: string;
		lastSeen: string;
		delete: string;
		deleteMessage: string;
		sessionEnds: string;
		deleteError: string;
	};
};
