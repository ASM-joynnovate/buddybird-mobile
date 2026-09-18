import { registeredUser } from "@/services/auth/registration"

const scope = () => ["api", registeredUser()] as const

export const apiKeys = {
	all: scope,
	me: () => [...scope(), "users", "me"] as const,
	settings: () => [...scope(), "users", "me", "settings"] as const,
	consents: () => [...scope(), "users", "me", "consents"] as const,
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
		detail: (id: string) => [...scope(), "sessions", id] as const,
		events: (id: string) => [...scope(), "sessions", id, "events"] as const,
		sounds: (id: string) => [...scope(), "sessions", id, "sounds"] as const,
	},
	notices: {
		all: () => [...scope(), "notices"] as const,
		list: () => [...scope(), "notices", "list"] as const,
		detail: (id: string) => [...scope(), "notices", id] as const,
	},
	mutation: (...parts: string[]) => ["api", ...parts] as const,
}
