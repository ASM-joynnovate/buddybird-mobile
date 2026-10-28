export type SettingsMessages = {
	title: string;
	saveError: string;
	notifications: {
		title: string;
		all: string;
		permissionOff: string;
	};
	general: {
		title: string;
		languageAndCountry: string;
		language: string;
		languageSearchHint: string;
		languageNotFound: string;
		country: string;
		countryChoose: string;
		countrySearchHint: string;
		searchClear: string;
		countryNotFound: string;
		devices: string;
	};
	privacy: {
		title: string;
		feed: string;
		feedDetail: string;
		leaderboard: string;
		leaderboardDetail: string;
		consents: string;
	};
	account: {
		signOut: string;
		withdraw: string;
	};
	support: {
		title: string;
		feedback: string;
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
