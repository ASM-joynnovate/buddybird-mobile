import { useEffect, useState } from "react"
import { z } from "zod"

import type { ReportPeriod } from "@/types/apis/reports"
import { localDate } from "@/utils/date"

const paramsSchema = z.object({
	period: z.enum(["day", "week", "month"]).optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
})

type Selection = { period: ReportPeriod; start: string }

export type ReportPeriodState = {
	period: ReportPeriod
	start: string
	end: Date
	isLatest: boolean
	select(period: ReportPeriod): void
	move(step: 1 | -1): void
}

function parseLocalDate(value: string): Date {
	const [year, month, day] = value.split("-").map(Number)

	return new Date(year, month - 1, day)
}

function periodStart(period: ReportPeriod, date: Date): Date {
	const year = date.getFullYear()
	const month = date.getMonth()
	const day = date.getDate()

	if (period === "week") {
		return new Date(year, month, day - ((date.getDay() + 6) % 7))
	}

	return period === "month" ? new Date(year, month, 1) : new Date(year, month, day)
}

function shift(period: ReportPeriod, start: Date, step: number): Date {
	const year = start.getFullYear()
	const month = start.getMonth()
	const day = start.getDate()

	if (period === "month") {
		return new Date(year, month + step, 1)
	}

	return new Date(year, month, day + (period === "week" ? 7 : 1) * step)
}

function latestStart(period: ReportPeriod): string {
	return localDate(periodStart(period, new Date()))
}

function fromParams(params: unknown): Selection {
	const parsed = paramsSchema.safeParse(params ?? {})
	const period = (parsed.success && parsed.data.period) || "day"
	const date = parsed.success && parsed.data.date ? parseLocalDate(parsed.data.date) : new Date()
	const start = localDate(periodStart(period, date))
	const latest = latestStart(period)

	return { period, start: start > latest ? latest : start }
}

export function useReportPeriod(params: unknown): ReportPeriodState {
	const [selection, setSelection] = useState(() => fromParams(params))

	const start = parseLocalDate(selection.start)
	const next = shift(selection.period, start, 1)

	useEffect(() => {
		if (params) {
			setSelection(fromParams(params))
		}
	}, [params])

	return {
		period: selection.period,
		start: selection.start,
		end: new Date(next.getFullYear(), next.getMonth(), next.getDate() - 1),
		isLatest: selection.start >= latestStart(selection.period),
		select: (period) => setSelection({ period, start: latestStart(period) }),
		move: (step) => {
			const target = localDate(shift(selection.period, start, step))

			if (target <= latestStart(selection.period)) {
				setSelection({ period: selection.period, start: target })
			}
		},
	}
}
