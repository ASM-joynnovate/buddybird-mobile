import type { TFunction } from "i18next"
import type { z } from "zod"

import { config } from "@/config"
import { ApiError, envelopeSchema, errorBodySchema } from "@/types/apis/common"

type ApiDependencies = {
	deviceId: () => string
	accessToken: () => Promise<string>
	report: (error: unknown, context: string) => void
}

let dependencies: ApiDependencies | undefined

export function configureApi(next: ApiDependencies) {
	dependencies = next
}

type QueryValue = string | number | boolean | undefined

export type ApiOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
	query?: Record<string, QueryValue>
	json?: unknown
	body?: FormData
	headers?: Record<string, string>
	idempotencyKey?: string
	signal?: AbortSignal
	timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

export async function apiRequest<T>(
	path: string,
	schema: z.ZodType<T>,
	options: ApiOptions = {},
): Promise<{ data: T; meta: unknown }> {
	const {
		method = "GET",
		query,
		json,
		body,
		headers: given,
		idempotencyKey,
		signal,
		timeoutMs = DEFAULT_TIMEOUT_MS,
	} = options
	const origin = config.apiBaseUrl

	if (!origin) {
		throw new ApiError(0, "CLIENT__NETWORK", "API base URL is not configured")
	}

	if (!dependencies) {
		throw new ApiError(0, "CLIENT__NETWORK", "API client is not configured")
	}

	const headers = new Headers({
		"X-BuddyBird-Client": "mobile",
		"X-Device-Id": dependencies.deviceId(),
		"Authorization": `Bearer ${await dependencies.accessToken()}`,
	})

	if (idempotencyKey) {
		headers.set("Idempotency-Key", idempotencyKey)
	}

	if (json !== undefined) {
		headers.set("Content-Type", "application/json")
	}

	for (const [name, value] of Object.entries(given ?? {})) {
		headers.set(name, value)
	}

	const response = await send(`${origin}${path}${queryString(query)}`, {
		method,
		headers,
		body: json === undefined ? body : JSON.stringify(json),
		signal,
		timeoutMs,
	})
	const parsed = parseBody(response.text)

	if (!response.ok) {
		const failure = errorBodySchema.safeParse(parsed)

		throw report(
			failure.success
				? new ApiError(
						response.status,
						failure.data.error_code,
						failure.data.message,
						response.requestId,
						parsed,
					)
				: invalidResponse(response, parsed),
		)
	}

	const envelope = envelopeSchema.safeParse(parsed ?? { message: "", data: null, meta: null })
	const data = envelope.success ? schema.safeParse(envelope.data.data) : envelope

	if (!envelope.success || !data.success) {
		throw report(invalidResponse(response, parsed))
	}

	return { data: data.data, meta: envelope.data.meta }
}

export function apiErrorMessage(error: unknown, t: TFunction): string {
	if (error instanceof ApiError) {
		return t(`app.apiError.${error.code}`, { defaultValue: error.message })
	}

	return t("app.apiError.CLIENT__NETWORK")
}

function queryString(query: Record<string, QueryValue> | undefined) {
	const params = new URLSearchParams()

	for (const [name, value] of Object.entries(query ?? {})) {
		if (value !== undefined) {
			params.set(name, String(value))
		}
	}

	const encoded = params.toString()

	return encoded ? `?${encoded}` : ""
}

type SendOptions = {
	method: string
	headers: Headers
	body: BodyInit | undefined
	signal: AbortSignal | undefined
	timeoutMs: number
}

type Received = { ok: boolean; status: number; requestId: string | null; text: string }

async function send(url: string, options: SendOptions): Promise<Received> {
	const { signal, timeoutMs, ...init } = options
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

		return {
			ok: response.ok,
			status: response.status,
			requestId: response.headers.get("X-Request-ID"),
			text: await response.text(),
		}
	} catch (error) {
		if (timedOut) {
			throw new ApiError(0, "CLIENT__TIMEOUT", "Request timed out")
		}

		if (signal?.aborted) {
			throw error
		}

		throw new ApiError(
			0,
			"CLIENT__NETWORK",
			error instanceof Error ? error.message : "Network request failed",
		)
	} finally {
		clearTimeout(timer)
		signal?.removeEventListener("abort", cancel)
	}
}

function parseBody(text: string): unknown {
	if (!text) {
		return null
	}

	try {
		return JSON.parse(text)
	} catch {
		return undefined
	}
}

function invalidResponse(response: Received, body: unknown) {
	return new ApiError(
		response.status,
		"CLIENT__INVALID_RESPONSE",
		`Invalid server response (HTTP ${response.status})`,
		response.requestId,
		body,
	)
}

function report(error: ApiError) {
	if (error.status >= 500 || error.code === "CLIENT__INVALID_RESPONSE") {
		dependencies?.report(error, `api:${error.requestId ?? "-"}`)
	}

	return error
}
