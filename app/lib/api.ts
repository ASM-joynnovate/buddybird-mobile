import { ApiError, apiErrorCodes, envelopeSchema, errorBodySchema } from '@/types/apis/common';

import type { TFunction } from 'i18next';

import type { z } from 'zod';

import { API_TIMEOUT_MS, env } from '@/config';

interface ApiDependencies {
	deviceId: () => string;
	locale: () => string;
	accessToken: () => Promise<string>;
	reportError: (error: unknown, scope: string) => void;
}

let dependencies: ApiDependencies | undefined;

/** API 요청 설정 등록 함수 */
export const configureApi = (next: ApiDependencies) => {
	dependencies = next;
};

type SearchParamValue = string | number | boolean | undefined;

interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	searchParams?: Record<string, SearchParamValue>;
	json?: unknown;
	body?: FormData;
	headers?: Record<string, string>;
	idempotencyKey?: string;
	signal?: AbortSignal;
	timeoutMs?: number;
}

const SERVER_ERROR_STATUS = 500;

/** 응답을 스키마로 검사하는 API 요청 함수 */
export const apiRequest = async <T>(path: string, schema: z.ZodType<T>, options: ApiOptions = {}) => {
	const {
		method = 'GET',
		searchParams,
		json,
		body,
		headers: customHeaders,
		idempotencyKey,
		signal,
		timeoutMs = API_TIMEOUT_MS,
	} = options;

	const baseUrl = env.apiBaseUrl;

	if (!baseUrl) {
		throw new ApiError(0, 'CLIENT__NETWORK', 'API base URL is not configured');
	}

	if (!dependencies) {
		throw new ApiError(0, 'CLIENT__NETWORK', 'API client is not configured');
	}

	const headers = new Headers({
		'X-BuddyBird-Client': 'mobile',
		'X-Device-Id': dependencies.deviceId(),
		'Accept-Language': dependencies.locale(),
		Authorization: `Bearer ${await dependencies.accessToken()}`,
	});

	if (idempotencyKey) {
		headers.set('Idempotency-Key', idempotencyKey);
	}

	if (json !== undefined) {
		headers.set('Content-Type', 'application/json');
	}

	for (const [name, value] of Object.entries(customHeaders ?? {})) {
		headers.set(name, value);
	}

	const response = await send(`${baseUrl}${path}${queryString(searchParams)}`, {
		method,
		headers,
		body: json === undefined ? body : JSON.stringify(json),
		signal,
		timeoutMs,
	});
	const parsed = parseBody(response.text);

	if (!response.ok) {
		const errorBody = errorBodySchema.safeParse(parsed);

		throw reportServerError(
			errorBody.success
				? new ApiError(
						response.status,
						knownErrorCode(errorBody.data.error_code),
						errorBody.data.message,
						response.requestId,
						parsed,
					)
				: invalidResponseError(response, parsed),
		);
	}

	const envelope = envelopeSchema.safeParse(parsed ?? { message: '', data: null, meta: null });
	const parsedData = envelope.success ? schema.safeParse(envelope.data.data) : envelope;

	if (!envelope.success || !parsedData.success) {
		throw reportServerError(invalidResponseError(response, parsed));
	}

	return { data: parsedData.data, meta: envelope.data.meta };
};

/** 오류 코드에 맞는 안내 문구를 반환하는 함수 */
export const apiErrorMessage = (error: unknown, t: TFunction) => {
	if (!(error instanceof ApiError)) {
		return t('apiError.CLIENT__NETWORK');
	}

	return error.code === 'CLIENT__UNKNOWN_ERROR' ? error.message : t(`apiError.${error.code}`);
};

/** 앱이 처리할 수 있는 오류 코드를 반환하는 함수 */
const knownErrorCode = (code: string) => {
	return apiErrorCodes.find((known) => known === code) ?? 'CLIENT__UNKNOWN_ERROR';
};

/** URL 쿼리 문자열 생성 함수 */
const queryString = (searchParams: Record<string, SearchParamValue> | undefined) => {
	const params = new URLSearchParams();

	for (const [name, value] of Object.entries(searchParams ?? {})) {
		if (value !== undefined) {
			params.set(name, String(value));
		}
	}

	const encoded = params.toString();

	return encoded ? `?${encoded}` : '';
};

interface SendOptions {
	method: string;
	headers: Headers;
	body: BodyInit | undefined;
	signal: AbortSignal | undefined;
	timeoutMs: number;
}

interface RawResponse {
	ok: boolean;
	status: number;
	requestId: string | null;
	text: string;
}

/** 제한 시간이 있는 fetch 요청 함수 */
const send = async (url: string, options: SendOptions) => {
	const { signal, timeoutMs, ...init } = options;
	const controller = new AbortController();
	let timedOut = false;

	/** 호출한 쪽에서 취소하면 fetch 요청도 취소 */
	const cancel = () => controller.abort(signal?.reason);

	if (signal?.aborted) {
		cancel();
	} else {
		signal?.addEventListener('abort', cancel, { once: true });
	}

	const timer = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, timeoutMs);

	try {
		const response = await fetch(url, { ...init, signal: controller.signal });

		return {
			ok: response.ok,
			status: response.status,
			requestId: response.headers.get('X-Request-ID'),
			text: await response.text(),
		};
	} catch (e) {
		if (timedOut) {
			throw new ApiError(0, 'CLIENT__TIMEOUT', 'Request timed out');
		}

		if (signal?.aborted) {
			throw e;
		}

		throw new ApiError(0, 'CLIENT__NETWORK', e instanceof Error ? e.message : 'Network request failed');
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', cancel);
	}
};

/** 응답 문자열을 JSON으로 파싱하는 함수 */
const parseBody = (text: string) => {
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
};

/** 응답 형식 오류 생성 함수 */
const invalidResponseError = (response: RawResponse, body: unknown) => {
	return new ApiError(
		response.status,
		'CLIENT__INVALID_RESPONSE',
		`Invalid server response (HTTP ${response.status})`,
		response.requestId,
		body,
	);
};

/** 서버 오류 보고 함수 */
const reportServerError = (error: ApiError) => {
	if (
		error.status >= SERVER_ERROR_STATUS ||
		error.code === 'CLIENT__INVALID_RESPONSE' ||
		error.code === 'CLIENT__UNKNOWN_ERROR'
	) {
		dependencies?.reportError(error, `api:${error.requestId ?? '-'}`);
	}

	return error;
};
