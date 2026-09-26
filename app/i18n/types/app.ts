export type AppMessages = {
	startup: {
		loading: string
		title: string
		message: string
		retry: string
	}
	storage: {
		settingError: string
		saveError: string
	}
	feedback: {
		thanks: string
		thanksClose: string
		retry: string
		promptTitle: string
		promptMessage: string
		later: string
		write: string
		title: string
		placeholder: string
		privacy: string
		send: string
		sent: string
		error: string
	}
	update: {
		title: string
		required: string
		body: string
		requiredBody: string
		accept: string
		later: string
		error: string
	}
}
