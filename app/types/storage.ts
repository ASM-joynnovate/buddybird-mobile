export type Store = {
	set(key: string, value: string): void
	getString(key: string): string | undefined
}
