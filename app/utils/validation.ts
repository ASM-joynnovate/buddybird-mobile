export type ObjectValue = Record<string, unknown>

export function requireId(value: unknown): string {
	if (typeof value !== "string" || !value || Object.hasOwn(Object.prototype, value)) {
		throw new Error("Invalid record ID")
	}

	return value
}

export function requireRecord(value: unknown, field: string): ObjectValue {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error(`Invalid ${field}`)
	}

	return value as ObjectValue
}

export function requireText(value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw new Error(`Invalid ${field}`)
	}

	return value
}

export function requireNonnegativeNumber(value: unknown, field: string): number {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`Invalid ${field}`)
	}

	return value
}

export function readNullableText(value: unknown, field: string): string | null {
	return value === null ? null : requireText(value, field)
}

export function requireChoice<T extends string>(
	value: unknown,
	choices: readonly T[],
	field: string,
): T {
	if (!choices.includes(value as T)) {
		throw new Error(`Invalid ${field}`)
	}

	return value as T
}

export function requireList(value: unknown, field: string): unknown[] {
	if (!Array.isArray(value)) {
		throw new Error(`Invalid ${field}`)
	}

	return value
}

export function readOptionalText(value: unknown, field: string) {
	return value === undefined ? undefined : requireText(value, field)
}
