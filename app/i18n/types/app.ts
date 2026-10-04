export type AppMessages = {
	startup: {
		loading: string;
	};
	startupError: {
		title: string;
		message: string;
	};
	feedback: {
		sentMessage: string;
		retry: string;
		promptTitle: string;
		promptMessage: string;
		write: string;
		title: string;
		placeholder: string;
		privacy: string;
		send: string;
		sentTitle: string;
		sendError: string;
	};
	update: {
		title: string;
		forcedTitle: string;
		message: string;
		forcedMessage: string;
		accept: string;
		openStoreError: string;
	};
};
