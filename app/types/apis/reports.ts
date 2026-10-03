import { localDateSchema, timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { judgmentStatusSchema } from '@/types/apis/sessions';

import { reportPeriodSchema } from '@/types/report-period';

import { z } from 'zod';

const wordRefSchema = z.object({ id: uuidSchema, name: z.string() });

const durationSchema = z.number().int().nonnegative();

const reportSessionSchema = z.object({
	id: uuidSchema,
	period: z.object({ started_at: timestampSchema, ended_at: timestampSchema.nullable() }),
	word: wordRefSchema,
	learning: z.object({ duration_ms: durationSchema }),
	judgment: z.object({ status: judgmentStatusSchema }),
});

export const reportSchema = z.object({
	period: z.object({ unit: reportPeriodSchema, start: localDateSchema, end: localDateSchema }),
	learning: z.object({
		duration_ms: durationSchema,
		trend: z.array(z.object({ start: timestampSchema, duration_ms: durationSchema })),
		words: z.array(z.object({ word: wordRefSchema, duration_ms: durationSchema })),
	}),
	sessions: z.array(reportSessionSchema),
});

export type ReportSession = z.infer<typeof reportSessionSchema>;
export type Report = z.infer<typeof reportSchema>;
