export const storageIds = {
	device: 'buddybird.device',
} as const;

export const persistKeys = {
	deviceSettings: { name: 'device-settings', version: 1 },
	account: { name: 'account', version: 2 },
} as const;
