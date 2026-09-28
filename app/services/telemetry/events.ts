export const FIREBASE_NAME_LIMIT = 40;

export function firebaseParameters(eventParams: Record<string, unknown>) {
	const firebaseParams: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(eventParams)) {
		if (value == null || (typeof value === 'number' && !Number.isFinite(value))) {
			continue;
		}

		if (typeof value === 'string' || Array.isArray(value)) {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = (Array.isArray(value) ? value.join(',') : value).slice(
				0,
				100,
			);
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = value;
		}
	}

	return firebaseParams;
}

export async function sendTelemetrySafely(send: () => void | Promise<unknown>): Promise<void> {
	try {
		await send();
	} catch {
		// Analytics must not interrupt learning, storage, or app lifecycle handling.
	}
}
