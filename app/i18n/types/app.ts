export type AppMessages = {
	startup: {
		loading: string
		title: string
		message: string
		retry: string
	}
	apiError: {
		AUTH__INVALID_TOKEN: string
		AUTH__INVALID_PROVIDER_CREDENTIAL: string
		AUTH__PROVIDER_CREDENTIAL_REQUIRED: string
		AUTH__SERVICE_UNAVAILABLE: string
		CLIENT__NETWORK: string
		CLIENT__TIMEOUT: string
		CLIENT__INVALID_RESPONSE: string
	}
	storage: {
		loading: string
		partial: string
		unavailable: string
		settingError: string
		saveError: string
	}
	consent: {
		title: string
		body: string
		decline: string
		accept: string
		error: string
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
