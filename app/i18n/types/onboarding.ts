export type OnboardingMessages = {
	login: {
		tagline: string;
		greeting: {
			title: string;
			body: string;
		};
		words: string[];
	};
	consent: {
		intro: string;
		all: string;
	};
	usage: {
		record: {
			title: string;
			scene: string;
			recording: string;
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
			lastWeek: string;
			comparedToLastWeek: string;
		};
	};
	permissions: {
		intro: string;
		scene: string;
		buddyWord: string;
		listening: string;
		alert: {
			appName: string;
			time: string;
			message: string;
		};
		purpose: {
			microphone: string;
			notifications: string;
		};
		allow: string;
		later: string;
	};
	marketing: {
		intro: string;
		scene: string;
		news: {
			features: string;
			events: string;
		};
		hint: string;
		accept: string;
		decline: string;
	};
	legacy: {
		uploading: string;
		uploadError: string;
		askTitle: string;
	};
};
