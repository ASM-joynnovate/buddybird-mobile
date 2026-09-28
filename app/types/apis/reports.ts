import { localDateSchema, timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { judgmentStatusSchema } from '@/types/apis/sessions';

import { reportPeriodSchema } from '@/types/report-period';

import { z } from 'zod';

const wordRefSchema = z.object({ id: uuidSchema, name: z.string() });

const durationSchema = z.number().int().nonnegative();

const reportSessionSchema = z.object({
	id: uuidSchema,
	started_at: timestampSchema,
	ended_at: timestampSchema.nullable(),
	word: wordRefSchema.nullable(),
	learning_duration_ms: durationSchema,
	judgment_status: judgmentStatusSchema,
});

export const reportSchema = z.object({
	period: reportPeriodSchema,
	start: localDateSchema,
	end: localDateSchema,
	learning_duration_ms: durationSchema,
	trend: z.array(z.object({ start: timestampSchema, learning_duration_ms: durationSchema })),
	words: z.array(z.object({ word: wordRefSchema, learning_duration_ms: durationSchema })),
	sessions: z.array(reportSessionSchema),
	mimicry: z.object({ count: z.number().int().nonnegative() }),
});

export type ReportSession = z.infer<typeof reportSessionSchema>;
export type Report = z.infer<typeof reportSchema>;
