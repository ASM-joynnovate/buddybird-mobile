export function joinLabel(...parts: (string | null | undefined | false)[]): string {
	return parts.filter(Boolean).join(", ")
}
