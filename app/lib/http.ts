export class HttpError extends Error {
	constructor(
		readonly status: number,
		readonly body: unknown,
	) {
		super(`HTTP ${status}`)
		this.name = "HttpError"
	}

	get retryable() {
		return this.status === 408 || this.status === 429 || this.status >= 500
	}
}

export class TimeoutError extends Error {
	constructor() {
		super("Request timed out")
		this.name = "TimeoutError"
	}
}

export class ResponseError extends Error {
	constructor(message = "Invalid server response") {
		super(message)
		this.name = "ResponseError"
	}
}

/** One attempt only. Queries and the durable upload worker own their retries. */
export async function requestJSON(
	url: string,
	options: RequestInit & { timeoutMs?: number; optionalJSON?: boolean } = {},
): Promise<unknown> {
	const { timeoutMs = 30_000, optionalJSON = false, signal, ...init } = options
	const controller = new AbortController()
	let timedOut = false
	const cancel = () => controller.abort(signal?.reason)

	if (signal?.aborted) {
		cancel()
	} else {
		signal?.addEventListener("abort", cancel, { once: true })
	}

	const timer = setTimeout(() => {
		timedOut = true
		controller.abort()
	}, timeoutMs)

	try {
		const response = await fetch(url, { ...init, signal: controller.signal })
		const text = await response.text()
		let body: unknown = null

		try {
			body = text ? JSON.parse(text) : null
		} catch {
			if (response.ok && !optionalJSON) {
				throw new ResponseError()
			}
		}

		if (!response.ok) {
			throw new HttpError(response.status, body)
		}

		return body
	} catch (error) {
		if (timedOut) {
			throw new TimeoutError()
		}

		throw error
	} finally {
		clearTimeout(timer)
		signal?.removeEventListener("abort", cancel)
	}
}
