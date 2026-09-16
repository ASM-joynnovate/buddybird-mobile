export type PushAuthorization =
	| "not_determined"
	| "denied"
	| "authorized"
	| "provisional"
	| "ephemeral"

export type PushReceipt = {
	messageId: string | null
	from: string | null
	sentTime: number | null
	source: "foreground" | "background" | "notification_opened"
	receivedAt: string
}
