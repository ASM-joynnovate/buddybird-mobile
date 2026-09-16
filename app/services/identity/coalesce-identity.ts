/** Native auth persists the user; this only coalesces concurrent acquisition. */
export function coalesceIdentity(current: () => string | null, signIn: () => Promise<string>) {
	let pending: Promise<string> | null = null

	return () => {
		const uid = current()

		if (uid) {
			return Promise.resolve(uid)
		}

		pending ??= signIn().finally(() => {
			pending = null
		})

		return pending
	}
}
