import { z } from "zod"

import { mockServer } from "@/apis/mock/server"
import { soundSchema } from "@/apis/sessions"
import { wordRefSchema } from "@/apis/words"

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const reportPeriodSchema = z.enum(["day", "week", "month"])

const reportSchema = z.object({
	period: reportPeriodSchema,
	start: localDate,
	end: localDate,
	total_play_count: z.number().int().nonnegative(),
	total_play_duration_ms: z.number().int().nonnegative(),
	mimicry_count: z.number().int().nonnegative(),
	trend: z.array(
		z.object({
			start: z.iso.datetime({ offset: true }),
			play_duration_ms: z.number().int().nonnegative(),
		}),
	),
	words: z.array(z.object({ word: wordRefSchema, play_count: z.number().int().nonnegative() })),
	sounds: z.array(soundSchema),
})

export type ReportPeriod = z.infer<typeof reportPeriodSchema>
export type Report = z.infer<typeof reportSchema>

export async function fetchReport(period: ReportPeriod, start: string): Promise<Report> {
	return reportSchema.parse(await mockServer.reports.get(period, start))
}
