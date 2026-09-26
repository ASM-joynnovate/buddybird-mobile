import { MONTHS_PER_YEAR } from "@/utils/units"

export function localDate(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function ageMonths(birthDate: string | null, now = new Date()): number | null {
	if (!birthDate) {
		return null
	}

	const [year, month, day] = birthDate.split("-").map(Number)

	if (![year, month, day].every(Number.isFinite)) {
		return null
	}

	return Math.max(
		0,
		(now.getFullYear() - year) * MONTHS_PER_YEAR +
			now.getMonth() +
			1 -
			month -
			(now.getDate() < day ? 1 : 0),
	)
}
