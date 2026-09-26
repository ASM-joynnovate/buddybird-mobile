import type { HomeMessages } from "@/i18n/types/home"

export const home: HomeMessages = {
	notifications: "Notifications",
	notificationsUnread: "Notifications, {{count}} unread",
	settings: "Settings",
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
