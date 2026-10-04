export type UnknownRecord = Record<string, unknown>;

/** 객체인지 검사하는 함수 */
export const requireRecord = (value: unknown, field: string) => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`Invalid ${field}`);
	}

	return value as UnknownRecord;
};

/** 문자열인지 검사하는 함수 */
export const requireText = (value: unknown, field: string) => {
	if (typeof value !== 'string') {
		throw new Error(`Invalid ${field}`);
	}

	return value;
};

/** 0 이상의 숫자인지 검사하는 함수 */
export const requireNonnegativeNumber = (value: unknown, field: string) => {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		throw new Error(`Invalid ${field}`);
	}

	return value;
};

/** null 또는 문자열 값을 읽는 함수 */
export const readNullableText = (value: unknown, field: string) => {
	return value === null ? null : requireText(value, field);
};

/** 허용된 값인지 검사하는 함수 */
export const requireChoice = <T extends string>(value: unknown, choices: readonly T[], field: string) => {
	if (!choices.includes(value as T)) {
		throw new Error(`Invalid ${field}`);
	}

	return value as T;
};

/** 없거나 문자열인 값을 읽는 함수 */
export const readOptionalText = (value: unknown, field: string) => {
	return value === undefined ? undefined : requireText(value, field);
};
