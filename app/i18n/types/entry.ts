export type EntryMessages = {
	login: {
		product: string
	}
	consent: {
		intro: string
		all: string
		required: string
		optional: string
		viewFull: string
	}
	consentDetail: {
		agree: string
	}
	parrot: {
		intro: string
		addTitle: string
		editTitle: string
		register: string
		delete: string
		deleteError: string
		photoType: string
		photoSize: string
		photoError: string
	}
	usage: {
		words: {
			title: string
			scene: string
		}
		login: {
			title: string
			scene: string
		}
		station: {
			title: string
			scene: string
		}
		viewer: {
			title: string
			scene: string
		}
	}
	permissions: {
		title: string
		scene: string
		microphone: string
		notifications: string
		allow: string
		later: string
		saveError: string
	}
}
