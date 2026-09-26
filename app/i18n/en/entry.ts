import type { EntryMessages } from "@/i18n/types/entry"

export const entry: EntryMessages = {
	login: {
		product: "BuddyBird",
	},
	consent: {
		intro: "Please agree to use the BuddyBird app!",
		all: "Agree to all",
		required: "Required",
		optional: "Optional",
		viewFull: "Read {{title}}",
	},
	consentDetail: {
		agree: "Agree",
	},
	parrot: {
		intro: "Tell me about your parrot!",
		addTitle: "Add parrot",
		editTitle: "Edit parrot",
		register: "Add",
		delete: "Delete parrot",
		deleteError: "We couldn't delete the parrot. Please try again.",
		photoType: "Only JPEG or PNG photos work. Please choose another photo.",
		photoSize: "Photos must be 5MB or smaller. Please choose another photo.",
		photoError: "We couldn't load the photo. Please choose it again.",
	},
	usage: {
		words: {
			title: "Record the words to teach your parrot in your own voice",
			scene: "a person recording a word into a microphone with Buddy",
		},
		login: {
			title: "Get a spare phone and sign in with the same account",
			scene: "two phones signed in to the same account",
		},
		station: {
			title: "Place that phone by the cage and press Start to play words to your parrot",
			scene: "a phone standing sideways by the cage",
		},
		viewer: {
			title: "When you're out, watch your parrot and get alerts on your own phone",
			scene: "a person checking the parrot on a phone while away",
		},
	},
	permissions: {
		title: "Permissions BuddyBird needs",
		scene: "Buddy explaining permissions",
		microphone: "Record words and your parrot's sounds",
		notifications: "Learning alerts",
		allow: "Allow",
		later: "Later",
		saveError: "We couldn't save your progress. Please tap the button again.",
	},
}
