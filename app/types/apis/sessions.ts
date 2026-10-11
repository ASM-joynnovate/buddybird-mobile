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
	sounds: z.object({
		vad_count: z.number().int().nonnegative(),
		parrot_count: z.number().int().nonnegative(),
		mimic_count: z.number().int().nonnegative(),
	}),
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

const scoreSchema = z.number().min(0).max(1);

export const sessionSoundSchema = z.object({
	id: uuidSchema,
	session_id: uuidSchema,
	captured_at: timestampSchema,
	audio_file: fileSchema,
	analysis: z.object({ score: scoreSchema }).nullish(),
	judgment: z.object({ word_id: uuidSchema.nullable(), score: scoreSchema.nullish() }).nullable(),
});

const sessionEventKindSchema = z.enum([
	'session_started',
	'learning_started',
	'learning_toggled',
	'learning_finished',
	'word_changed',
	'station_disconnected',
	'station_reconnected',
	'emergency_detected',
	'session_finished',
]);

export const sessionEventSchema = z.object({
	id: uuidSchema,
	kind: sessionEventKindSchema,
	occurred_at: timestampSchema,
	ended_at: timestampSchema.nullable(),
	word: z.object({ id: uuidSchema }).nullable(),
	sound_ids: z.array(uuidSchema),
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
export type SessionEvent = z.infer<typeof sessionEventSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
