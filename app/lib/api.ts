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

/** 서버 요청에 쓸 기기 ID, 언어, 액세스 토큰과 오류 보고 함수 등록 */
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

/** 서버에 요청을 보내고 스키마로 검사한 응답의 data와 meta 반환 */
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

/** 오류 코드에 맞는 사용자 문구, ApiError가 아니면 네트워크 연결 문구 */
export const apiErrorMessage = (error: unknown, t: TFunction) => {
	if (!(error instanceof ApiError)) {
		return t('apiError.CLIENT__NETWORK');
	}

	return error.code === 'CLIENT__UNKNOWN_ERROR' ? error.message : t(`apiError.${error.code}`);
};

/** 서버 오류 코드 가운데 앱이 아는 코드, 모르는 코드면 CLIENT__UNKNOWN_ERROR */
const knownErrorCode = (code: string) => {
	return apiErrorCodes.find((known) => known === code) ?? 'CLIENT__UNKNOWN_ERROR';
};

/** 값이 있는 항목만 담은 URL 쿼리 문자열 */
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

/** 시간 제한을 두고 fetch로 요청을 보낸 뒤 응답 상태, 요청 ID, 응답 문자열 반환 */
const send = async (url: string, options: SendOptions) => {
	const { signal, timeoutMs, ...init } = options;
	const controller = new AbortController();
	let timedOut = false;

	/** 호출한 쪽의 취소를 fetch 요청에 전달 */
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

/** 응답 문자열의 JSON 해석, 비었으면 null, JSON이 아니면 undefined */
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

/** 서버 응답 형식이 맞지 않을 때의 CLIENT__INVALID_RESPONSE 오류 */
const invalidResponseError = (response: RawResponse, body: unknown) => {
	return new ApiError(
		response.status,
		'CLIENT__INVALID_RESPONSE',
		`Invalid server response (HTTP ${response.status})`,
		response.requestId,
		body,
	);
};

/** 5xx 응답, 응답 형식 오류, 모르는 오류 코드 보고 */
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
