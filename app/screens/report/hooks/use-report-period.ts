import dayjs from "dayjs"
import { useState } from "react"

import type { ReportPeriod } from "@/types/report-period"
import { localDate, periodsBetween } from "@/utils/date"
import { fromParams, latestStart } from "@/utils/report-period"

export type ReportPeriodState = {
	period: ReportPeriod
	start: string
	isLatest: boolean
	periodsAgo: number
	select(period: ReportPeriod): void
	move(step: 1 | -1): void
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
