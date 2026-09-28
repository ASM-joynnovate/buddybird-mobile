export interface LinkedDevice {
	id: string;
	model: string;
	lastSeenAt: string | null;
	isThisDevice: boolean;
	isRunningSession: boolean;
}
