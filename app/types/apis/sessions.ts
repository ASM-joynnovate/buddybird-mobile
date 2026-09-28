import { localDate, timestamp, uuid } from '@/types/apis/primitives';

import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const phaseSchema = z.enum(['learning', 'rest', 'stress_care', 'sleeping']);

const sessionStatusSchema = z.enum(['running', 'finished']);

export const judgmentStatusSchema = z.enum(['pending', 'done']);

export const sessionSchema = z.object({
	id: uuid,
	status: sessionStatusSchema,
	station: z.object({ device_id: uuid }),
	word_id: uuid.nullable(),
	progress: z.object({
		current_phase: phaseSchema.nullable(),
		phase_started_at: timestamp.nullable(),
		last_heartbeat_at: timestamp.nullable(),
	}),
	period: z.object({
		started_at: timestamp,
		ended_at: timestamp.nullable(),
		ended_by: z.enum(['user', 'server']).nullable(),
	}),
	ends_at: timestamp.nullable(),
	sleep: sleepSettingsSchema,
	judgment_status: judgmentStatusSchema,
});

const startSessionRequestSchema = z.object({
	word_id: uuid.nullable().optional(),
	ends_at: timestamp.nullable().optional(),
	sleep: sleepSettingsSchema.optional(),
});

const heartbeatRequestSchema = z.object({
	current_phase: phaseSchema.nullable(),
	phase_started_at: timestamp.nullable(),
	timezone: z.string().min(1).max(64),
	summaries: z
		.array(
			z.object({
				word_id: uuid,
				local_date: localDate,
				play_count: z.number().int().nonnegative(),
				play_duration_ms: z.number().int().nonnegative(),
				learning_duration_ms: z.number().int().nonnegative().optional(),
			}),
		)
		.max(500),
});

export const heartbeatSchema = z.object({
	session: z.object({ status: sessionStatusSchema }),
	acknowledged: z.array(z.object({ word_id: uuid, local_date: localDate })),
});

export const sessionSoundSchema = z.object({
	id: uuid,
	session_id: uuid,
	captured_at: timestamp,
	audio: z.object({ url: z.string() }),
	judgment: z.object({ word_id: uuid.nullable() }).nullable(),
});

export type Phase = z.infer<typeof phaseSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
export type HeartbeatSummary = HeartbeatRequest['summaries'][number];
export type Heartbeat = z.infer<typeof heartbeatSchema>;
export type SessionSound = z.infer<typeof sessionSoundSchema>;
