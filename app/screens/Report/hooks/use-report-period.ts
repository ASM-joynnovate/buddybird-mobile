import dayjs, { type Dayjs } from "dayjs"
import { useState } from "react"
import { z } from "zod"

import { type ReportPeriod, reportPeriodSchema } from "@/types/report-period"
import { localDate, periodsBetween } from "@/utils/date"

const paramsSchema = z.object({
	period: reportPeriodSchema.optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
})

type Selection = { period: ReportPeriod; start: string }

export type ReportPeriodState = {
	period: ReportPeriod
	start: string
	isLatest: boolean
	periodsAgo: number
	select(period: ReportPeriod): void
	move(step: 1 | -1): void
}

function periodStart(period: ReportPeriod, date: Dayjs): Dayjs {
	if (period === "week") {
		return date.subtract((date.day() + 6) % 7, "day").startOf("day")
	}

	return date.startOf(period)
}

function latestStart(period: ReportPeriod): string {
	return localDate(periodStart(period, dayjs()))
}

function fromParams(params: unknown): Selection {
	const parsed = paramsSchema.safeParse(params ?? {})
	const period = (parsed.success && parsed.data.period) || "day"
	const date = parsed.success && parsed.data.date ? dayjs(parsed.data.date) : dayjs()
	const start = localDate(periodStart(period, date))
	const latest = latestStart(period)

	return { period, start: start > latest ? latest : start }
}

export function useReportPeriod(params: unknown): ReportPeriodState {
	const [selection, setSelection] = useState(() => fromParams(params))
	const [appliedParams, setAppliedParams] = useState(params)

	if (params !== appliedParams) {
		setAppliedParams(params)

		if (params) {
			setSelection(fromParams(params))
		}
	}

	const start = dayjs(selection.start)

	return {
		period: selection.period,
		start: selection.start,
		isLatest: selection.start >= latestStart(selection.period),
		periodsAgo: periodsBetween(
			selection.period,
			selection.start,
			latestStart(selection.period),
		),
		select: (period) => setSelection({ period, start: latestStart(period) }),
		move: (step) => {
			const target = localDate(start.add(step, selection.period))

			if (target <= latestStart(selection.period)) {
				setSelection({ period: selection.period, start: target })
			}
		},
	}
}
