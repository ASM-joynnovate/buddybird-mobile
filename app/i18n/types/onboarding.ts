export type OnboardingMessages = {
	login: {
		product: string;
	};
	consent: {
		intro: string;
		all: string;
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
		intro: string;
		scene: string;
		purpose: {
			microphone: string;
			notifications: string;
		};
		allow: string;
		later: string;
	};
	legacy: {
		uploading: string;
		uploadError: string;
		askTitle: string;
	};
};
