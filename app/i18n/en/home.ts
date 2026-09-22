import type { HomeMessages } from "@/i18n/types/home"

export const home: HomeMessages = {
	brand: "BuddyBird",
	streak: "{{count}}-day streak",
	notifications: "Notifications",
	notificationsUnread: "Notifications, {{count}} unread",
	settings: "Settings",
	session: {
		running: "Session running on {{device}}",
		lost: "{{device}} disconnected",
	},
	emergency: "{{kind}} detected at {{time}}",
	parrot: {
		months: "{{count}} mo",
		years: "{{count}} yr",
		page: "Parrot {{current}} of {{total}}",
		edit: "Edit {{name}}",
		addPhoto: "Add a photo",
	},
	mimicry: {
		label: "{{word}}, sound mimicked at {{time}}",
		said: "was mimicked",
		empty: "Tap Start and Buddy will play your word",
	},
	notice: {
		detail: "Details",
		image: "Attached image {{index}}",
	},
	notification: {
		title: "Notifications",
		readAll: "Mark all read",
		readAllError: "Couldn't mark all as read. Tap again.",
		unread: "Unread",
		empty: "No notifications yet",
		emptyScene: "Buddy by an empty inbox",
	},
}
