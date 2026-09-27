import { z } from "zod"

import { localDate, timestamp, uuid } from "@/types/apis/primitives"
import { judgmentStatusSchema } from "@/types/apis/sessions"

const wordRefSchema = z.object({ id: uuid, name: z.string() })

const durationSchema = z.number().int().nonnegative()

export const reportPeriodSchema = z.enum(["day", "week", "month"])

const reportSessionSchema = z.object({
	id: uuid,
	started_at: timestamp,
	ended_at: timestamp.nullable(),
	word: wordRefSchema.nullable(),
	learning_duration_ms: durationSchema,
	judgment_status: judgmentStatusSchema,
})

export const reportSchema = z.object({
	period: reportPeriodSchema,
	start: localDate,
	end: localDate,
	learning_duration_ms: durationSchema,
	trend: z.array(z.object({ start: timestamp, learning_duration_ms: durationSchema })),
	words: z.array(z.object({ word: wordRefSchema, learning_duration_ms: durationSchema })),
	sessions: z.array(reportSessionSchema),
	mimicry: z.object({ count: z.number().int().nonnegative() }),
})

export type ReportPeriod = z.infer<typeof reportPeriodSchema>
export type ReportSession = z.infer<typeof reportSessionSchema>
export type Report = z.infer<typeof reportSchema>
