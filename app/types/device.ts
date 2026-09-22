export type LinkedDevice = {
	id: string
	name: string | null
	model: string
	lastSeenAt: string | null
	isThisDevice: boolean
	isRunningSession: boolean
}
