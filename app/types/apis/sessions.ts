import { fileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const phaseSchema = z.enum(['learning', 'rest', 'stress_care', 'sleeping']);

const sessionStatusSchema = z.enum(['running', 'finished']);

export const judgmentStatusSchema = z.enum(['pending', 'done']);

export const sessionSchema = z.object({
	id: uuidSchema,
	status: sessionStatusSchema,
	station: z.object({ device_id: uuidSchema }),
	word: z.object({ id: uuidSchema }),
	schedule: z.object({ ends_at: timestampSchema.nullable(), sleep: sleepSettingsSchema.nullable() }),
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
	judgment: z.object({ status: judgmentStatusSchema }),
});

const startSessionRequestSchema = z.object({
	word_id: uuidSchema,
	ends_at: timestampSchema.nullable(),
	sleep: sleepSettingsSchema.nullable(),
});

const heartbeatRequestSchema = z.object({
	current_phase: phaseSchema.nullable(),
	phase_started_at: timestampSchema.nullable(),
	learning_segments: z
		.array(
			z.object({
				word_id: uuidSchema,
				started_at: timestampSchema,
				ended_at: timestampSchema,
				play_count: z.number().int().nonnegative(),
				play_duration_ms: z.number().int().nonnegative(),
			}),
		)
		.max(500),
});

export const heartbeatSchema = z.object({
	session: z.object({ status: sessionStatusSchema }),
	acknowledged: z.array(z.object({ word_id: uuidSchema, started_at: timestampSchema })),
});

export const sessionSoundSchema = z.object({
	id: uuidSchema,
	session_id: uuidSchema,
	captured_at: timestampSchema,
	audio_file: fileSchema,
	judgment: z.object({ word_id: uuidSchema.nullable() }).nullable(),
});

const activeSchema = z.object({ duration_ms: z.number().int().nonnegative() });

export const sessionSummarySchema = z.object({
	word: z.object({ id: uuidSchema, name: z.string(), active: activeSchema }),
	session: z.object({ play_count: z.number().int().nonnegative(), active: activeSchema }),
	total: z.object({ active: activeSchema }),
});

export type Phase = z.infer<typeof phaseSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
export type HeartbeatLearningSegment = HeartbeatRequest['learning_segments'][number];
export type Heartbeat = z.infer<typeof heartbeatSchema>;
export type SessionSound = z.infer<typeof sessionSoundSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
