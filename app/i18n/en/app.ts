import type { AppMessages } from "@/i18n/types/app"

export const app: AppMessages = {
	startup: {
		loading: "Preparing your saved data",
		title: "Could not load your data",
		message: "Your original data is preserved. Try again to continue preparing it.",
		retry: "Try again",
	},
	apiError: {
		AUTH__INVALID_TOKEN: "Your login has expired. Please log in again.",
		AUTH__INVALID_PROVIDER_CREDENTIAL:
			"Couldn't verify your social login. Please log in again.",
		AUTH__PROVIDER_CREDENTIAL_REQUIRED:
			"Your social login details are needed. Please log in again.",
		AUTH__SERVICE_UNAVAILABLE:
			"The login service is temporarily unavailable. Please try again shortly.",
		CLIENT__NETWORK: "Couldn't connect to BuddyBird. Check your connection and try again.",
		CLIENT__TIMEOUT:
			"The server took too long to respond. Check your connection and try again.",
		CLIENT__INVALID_RESPONSE: "Couldn't read the server response. Please try again shortly.",
	},
	storage: {
		loading: "Importing your saved data. Data that is ready is available to use.",
		partial: "Some data could not be imported. The originals are retained. You can try again.",
		unavailable:
			"Could not read your saved data. The originals are unchanged. Please try again.",
		settingError:
			"Could not read some device settings. Using defaults without changing the saved values.",
		saveError: "Could not confirm the save. Please try again.",
	},
	consent: {
		title: "Audio collection",
		body: "BuddyBird collects the sounds recorded during training so we can build and improve speech coaching for parrots.\nEverything is stored anonymously, without any account information.\nRecordings are deleted automatically after 180 days.\n* Declining does not change how you use the app.",
		decline: "Decline",
		accept: "Agree",
		error: "Couldn't save your choice. Please try again.",
	},
	feedback: {
		thanks: "Your feedback came through. We will use it to make BuddyBird better.",
		thanksClose: "Done",
		retry: "Try again",
		promptTitle: "Tell us what you think",
		promptMessage:
			"Share anything you love or wish were different about BuddyBird. It really helps!",
		later: "Close",
		write: "Give feedback",
		title: "Send feedback",
		placeholder: "Tell us what to improve, what feels off, or a feature you wish existed.",
		privacy: "⚠ Please do not include personal info like your name or contact details.",
		send: "Send",
		sent: "Thank you!",
		error: "Couldn't send your feedback. Your message is kept; check your connection and try again.",
	},
	update: {
		title: "Update available",
		required: "Update needed",
		body: "BuddyBird {{version}} is available.",
		requiredBody: "Update to {{version}} to keep using BuddyBird.",
		accept: "Update",
		later: "Close",
		error: "Couldn't open the store. Please try again.",
	},
}
