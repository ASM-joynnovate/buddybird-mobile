export function firebaseParameters(input: Record<string, unknown>) {
	const result: Record<string, string | number | boolean> = {}

	for (const [key, value] of Object.entries(input)) {
		if (value == null || (typeof value === "number" && !Number.isFinite(value))) {
			continue
		}

		if (typeof value === "string" || Array.isArray(value)) {
			result[key.slice(0, 40)] = (Array.isArray(value) ? value.join(",") : value).slice(
				0,
				100,
			)
		} else if (typeof value === "number" || typeof value === "boolean") {
			result[key.slice(0, 40)] = value
		}
	}

	return result
}

export async function sendTelemetrySafely(send: () => void | Promise<unknown>): Promise<void> {
	try {
		await send()
	} catch {
		// Analytics must not interrupt learning, storage, or app lifecycle handling.
	}
}
