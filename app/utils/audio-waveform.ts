const DB_FLOOR = -60
const DB_CEIL = -10
const NOISE_FLOOR = 0.25

export function meteringLevel(decibels?: number): number {
	if (decibels === undefined || !Number.isFinite(decibels)) {
		return 0
	}

	const normalized = Math.max(0, Math.min(1, (decibels - DB_FLOOR) / (DB_CEIL - DB_FLOOR)))

	return normalized < NOISE_FLOOR ? 0 : (normalized - NOISE_FLOOR) / (1 - NOISE_FLOOR)
}

function centreWeight(index: number, barCount: number): number {
	return 1 - Math.abs(index - barCount / 2) / (barCount / 2)
}

export function liveTargets(effective: number, barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) => {
		const jitter = (Math.random() - 0.5) * 0.35 * effective

		return Math.max(0, Math.min(1, effective * centreWeight(index, barCount) + jitter))
	})
}

export function loopTargets(barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) =>
		Math.max(0.08, centreWeight(index, barCount) * 0.55 + (Math.random() - 0.5) * 0.3),
	)
}
