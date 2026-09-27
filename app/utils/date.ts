import type { ReportPeriod } from "@/types/apis/reports"
import { DAY, DAYS_PER_WEEK, MONTHS_PER_YEAR } from "@/utils/units"

export function localDate(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function periodsBetween(period: ReportPeriod, from: string, to: string): number {
	const [fromYear, fromMonth, fromDay] = from.split("-").map(Number)
	const [toYear, toMonth, toDay] = to.split("-").map(Number)

	if (period === "month") {
		return (toYear - fromYear) * MONTHS_PER_YEAR + toMonth - fromMonth
	}

	const days = Math.round(
		(Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / DAY,
	)

	return period === "week" ? Math.round(days / DAYS_PER_WEEK) : days
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
