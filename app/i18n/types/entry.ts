export type EntryMessages = {
	login: {
		product: string;
	};
	consent: {
		intro: string;
		all: string;
		required: string;
		optional: string;
		viewFull: string;
	};
	consentDetail: {
		agree: string;
	};
	parrot: {
		intro: string;
		addTitle: string;
		editTitle: string;
		register: string;
		delete: string;
		deleteError: string;
		photoType: string;
		photoSize: string;
		photoError: string;
	};
	usage: {
		record: {
			title: string;
			scene: string;
		};
		place: {
			title: string;
			scene: string;
		};
		keepOn: {
			title: string;
			scene: string;
		};
		report: {
			title: string;
			scene: string;
		};
	};
	permissions: {
		title: string;
		scene: string;
		microphone: string;
		notifications: string;
		allow: string;
		later: string;
	};
	legacy: {
		uploading: string;
		error: string;
		askTitle: string;
		add: string;
		skip: string;
	};
};
