import { localDateSchema, timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const phaseSchema = z.enum(['learning', 'rest', 'stress_care', 'sleeping']);

const sessionStatusSchema = z.enum(['running', 'finished']);

export const judgmentStatusSchema = z.enum(['pending', 'done']);

export const sessionSchema = z.object({
	id: uuidSchema,
	status: sessionStatusSchema,
	station: z.object({ device_id: uuidSchema }),
	word_id: uuidSchema.nullable(),
	progress: z.object({
		current_phase: phaseSchema.nullable(),
		phase_started_at: timestampSchema.nullable(),
		last_heartbeat_at: timestampSchema.nullable(),
	}),
	period: z.object({
		started_at: timestampSchema,
		ended_at: timestampSchema.nullable(),
		ended_by: z.enum(['user', 'server']).nullable(),
	}),
	ends_at: timestampSchema.nullable(),
	sleep: sleepSettingsSchema.nullable(),
	judgment_status: judgmentStatusSchema,
});

const startSessionRequestSchema = z.object({
	word_id: uuidSchema.nullable().optional(),
	ends_at: timestampSchema.nullable().optional(),
	sleep: sleepSettingsSchema.nullable().optional(),
});

const heartbeatRequestSchema = z.object({
	current_phase: phaseSchema.nullable(),
	phase_started_at: timestampSchema.nullable(),
	timezone: z.string().min(1).max(64),
	summaries: z
		.array(
			z.object({
				word_id: uuidSchema,
				local_date: localDateSchema,
				play_count: z.number().int().nonnegative(),
				play_duration_ms: z.number().int().nonnegative(),
				learning_duration_ms: z.number().int().nonnegative().optional(),
			}),
		)
		.max(500),
});

export const heartbeatSchema = z.object({
	session: z.object({ status: sessionStatusSchema }),
	acknowledged: z.array(z.object({ word_id: uuidSchema, local_date: localDateSchema })),
});

export const sessionSoundSchema = z.object({
	id: uuidSchema,
	session_id: uuidSchema,
	captured_at: timestampSchema,
	audio: z.object({ url: z.string() }),
	judgment: z.object({ word_id: uuidSchema.nullable() }).nullable(),
});

export const sessionSummarySchema = z.object({
	word: z.object({ id: uuidSchema, name: z.string() }).nullable(),
	session: z.object({
		play_count: z.number().int().nonnegative(),
		learning_duration_ms: z.number().int().nonnegative(),
	}),
	total: z.object({
		word_learning_duration_ms: z.number().int().nonnegative().nullable(),
		learning_duration_ms: z.number().int().nonnegative(),
	}),
});

export type Phase = z.infer<typeof phaseSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
export type HeartbeatSummary = HeartbeatRequest['summaries'][number];
export type Heartbeat = z.infer<typeof heartbeatSchema>;
export type SessionSound = z.infer<typeof sessionSoundSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
