import { registeredUser } from "@/services/auth/registration"

const scope = () => ["api", registeredUser()] as const

export const apiKeys = {
	appUpdate: () => ["api", "app-update"] as const,
	all: scope,
	me: () => [...scope(), "users", "me"] as const,
	settings: () => [...scope(), "users", "me", "settings"] as const,
	consents: {
		all: () => [...scope(), "users", "me", "consents"] as const,
	},
	devices: () => [...scope(), "devices"] as const,
	parrots: {
		all: () => [...scope(), "parrots"] as const,
		detail: (id: string) => [...scope(), "parrots", id] as const,
	},
	words: {
		all: () => [...scope(), "words"] as const,
		detail: (id: string) => [...scope(), "words", id] as const,
	},
	sessions: {
		all: () => [...scope(), "sessions"] as const,
		list: () => [...scope(), "sessions", "list"] as const,
		range: (from: string, to: string) => [...scope(), "sessions", "list", from, to] as const,
		running: () => [...scope(), "sessions", "running"] as const,
		detail: (id: string) => [...scope(), "sessions", id] as const,
		events: (id: string) => [...scope(), "sessions", id, "events"] as const,
		sounds: (id: string) => [...scope(), "sessions", id, "sounds"] as const,
	},
	emergencies: {
		all: () => [...scope(), "emergencies"] as const,
		detail: (id: string) => [...scope(), "emergencies", id] as const,
	},
	home: () => [...scope(), "home"] as const,
	notifications: () => [...scope(), "notifications"] as const,
	reports: {
		all: () => [...scope(), "reports"] as const,
		detail: (period: string, start: string) => [...scope(), "reports", period, start] as const,
	},
	notices: {
		all: () => [...scope(), "notices"] as const,
		list: () => [...scope(), "notices", "list"] as const,
		detail: (id: string) => [...scope(), "notices", id] as const,
	},
	mocks: {
		homeExtras: () => [...scope(), "mocks", "home"] as const,
		stationStatus: (id: string) => [...scope(), "sessions", id, "mocks", "station"] as const,
		activity: (id: string) => [...scope(), "sessions", id, "mocks", "activity"] as const,
		plays: (id: string) => [...scope(), "sessions", id, "mocks", "plays"] as const,
		eventExtras: (id: string) => [...scope(), "sessions", id, "mocks", "events"] as const,
		soundFeedback: () => [...scope(), "mocks", "sound-feedback"] as const,
		soundAnalysis: () => [...scope(), "mocks", "sound-analysis"] as const,
		deviceNames: () => [...scope(), "devices", "mocks", "names"] as const,
		recordingStatus: (id: string) => [...scope(), "words", id, "mocks", "recordings"] as const,
		noticeNotifications: () => [...scope(), "notifications", "mocks", "notices"] as const,
	},
	mutation: (...parts: string[]) => ["api", ...parts] as const,
}
