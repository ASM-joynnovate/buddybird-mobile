import dayjs, { type Dayjs } from "dayjs"
import { z } from "zod"

import {
	type ReportPeriod,
	reportPeriodSchema,
	type ReportPeriodSelection,
} from "@/types/report-period"
import { localDate } from "@/utils/date"

const paramsSchema = z.object({
	period: reportPeriodSchema.optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
})

function periodStart(period: ReportPeriod, date: Dayjs): Dayjs {
	if (period === "week") {
		return date.subtract((date.day() + 6) % 7, "day").startOf("day")
	}

	return date.startOf(period)
}

export function latestStart(period: ReportPeriod): string {
	return localDate(periodStart(period, dayjs()))
}

export function fromParams(params: unknown): ReportPeriodSelection {
	const parsed = paramsSchema.safeParse(params ?? {})
	const period = (parsed.success && parsed.data.period) || "day"
	const date = parsed.success && parsed.data.date ? dayjs(parsed.data.date) : dayjs()
	const start = localDate(periodStart(period, date))
	const latest = latestStart(period)

	return { period, start: start > latest ? latest : start }
}
