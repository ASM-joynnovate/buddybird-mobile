export function meteringLevel(decibels?: number): number {
	if (decibels === undefined || !Number.isFinite(decibels)) {
		return 0
	}

	return Math.max(0, Math.min(1, (decibels + 60) / 60))
}
