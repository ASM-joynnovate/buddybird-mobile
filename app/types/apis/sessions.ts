import { fileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const phaseSchema = z.enum(['learning', 'rest', 'stress_care', 'sleeping']);

export const sessionSchema = z.object({
	id: uuidSchema,
	status: z.string(),
	station: z.object({ device_id: uuidSchema }),
	word: z.object({ id: uuidSchema }),
	schedule: z.object({ ends_at: timestampSchema.nullable(), sleep: sleepSettingsSchema.nullable() }),
	progress: z.object({
		current_phase: z.string().nullable(),
		phase_started_at: timestampSchema.nullable(),
		last_heartbeat_at: timestampSchema.nullable(),
	}),
	period: z.object({
		started_at: timestampSchema,
		ended_at: timestampSchema.nullable(),
		ended_by: z.string().nullable(),
	}),
	judgment: z.object({ status: z.string() }),
	sounds: z.object({
		vad_count: z.number().int().nonnegative(),
		parrot_count: z.number().int().nonnegative(),
		mimic_count: z.number().int().nonnegative(),
	}),
	events: z.object({
		distress_call_count: z.number().int().nonnegative(),
		parrot_disappeared_count: z.number().int().nonnegative(),
		parrot_motionless_count: z.number().int().nonnegative(),
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
	session: z.object({ status: z.string() }),
	acknowledged: z.array(z.object({ word_id: uuidSchema, started_at: timestampSchema })),
});

const scoreSchema = z.number().min(0).max(1);

const sessionUserReviewSchema = z.object({ is_correct: z.boolean() });

const sessionLogKindSchema = z.enum([
	'parrot',
	'mimic',
	'distress_call_detected',
	'parrot_disappeared',
	'parrot_appeared',
	'parrot_motionless',
	'parrot_moved',
]);

const sessionEventFileSchema = fileSchema.extend({ status: z.enum(['pending', 'uploaded', 'rejected']) });

const sessionLogSoundSchema = z.object({
	id: uuidSchema,
	captured_at: timestampSchema,
	audio_file: fileSchema,
	duration_ms: z.number().int().nonnegative().nullable(),
});

const sessionLogItemBaseSchema = z.object({
	id: uuidSchema,
	occurred_at: timestampSchema,
	user_review: sessionUserReviewSchema.nullable(),
});

const sessionLogSoundItemSchema = sessionLogItemBaseSchema.extend({
	audio_file: fileSchema,
	duration_ms: z.number().int().nonnegative().nullable(),
	score: scoreSchema.nullable(),
});

const sessionLogItemSchema = z.discriminatedUnion('kind', [
	sessionLogSoundItemSchema.extend({ kind: z.literal('parrot') }),
	sessionLogSoundItemSchema.extend({ kind: z.literal('mimic'), is_feed_shared: z.boolean() }),
	sessionLogItemBaseSchema.extend({
		kind: z.literal('distress_call_detected'),
		ended_at: timestampSchema.nullable(),
		sounds: z.array(sessionLogSoundSchema),
	}),
	sessionLogItemBaseSchema.extend({
		kind: z.literal('parrot_disappeared'),
		ended_at: timestampSchema.nullable(),
		image: sessionEventFileSchema.nullable(),
		video: sessionEventFileSchema.nullable(),
	}),
	sessionLogItemBaseSchema.extend({
		kind: z.literal('parrot_appeared'),
		image: sessionEventFileSchema.nullable(),
	}),
	sessionLogItemBaseSchema.extend({
		kind: z.literal('parrot_motionless'),
		ended_at: timestampSchema.nullable(),
		image: sessionEventFileSchema.nullable(),
		video: sessionEventFileSchema.nullable(),
	}),
	sessionLogItemBaseSchema.extend({
		kind: z.literal('parrot_moved'),
		image: sessionEventFileSchema.nullable(),
	}),
]);

export const sessionLogListSchema = z
	.array(z.looseObject({ kind: z.string() }))
	.transform((logItems) => logItems.filter((logItem) => sessionLogKindSchema.safeParse(logItem.kind).success))
	.pipe(z.array(sessionLogItemSchema));

const petcamEventKindSchema = z.enum(['parrot_disappeared', 'parrot_appeared', 'parrot_motionless', 'parrot_moved']);

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
export type SessionUserReview = z.infer<typeof sessionUserReviewSchema>;
export type SessionLogKind = z.infer<typeof sessionLogKindSchema>;
export type SessionLogSound = z.infer<typeof sessionLogSoundSchema>;
export type SessionLogItem = z.infer<typeof sessionLogItemSchema>;
export type SessionEventFile = z.infer<typeof sessionEventFileSchema>;
export type PetcamEventKind = z.infer<typeof petcamEventKindSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export interface SessionPetcamVideoParams {
	id: string;
	eventId: string;
	uri: string;
	idempotencyKey: string;
}

export interface SessionSoundParams {
	id: string;
	uri: string;
	data: SessionSoundUploadRequest;
	idempotencyKey: string;
}

export interface PostSessionParams {
	data: StartSessionRequest;
	idempotencyKey: string;
}

export interface PostSessionHeartbeatParams {
	id: string;
	data: HeartbeatRequest;
	idempotencyKey: string;
}

export interface GetSessionLogParams {
	id: string;
	kinds: SessionLogKind[];
	page: number;
}

export interface PutSessionSoundUserReviewParams {
	id: string;
	soundId: string;
	data: SessionUserReview;
	idempotencyKey: string;
}

export interface DeleteSessionSoundUserReviewParams {
	id: string;
	soundId: string;
	idempotencyKey: string;
}

export interface PutSessionEventUserReviewParams {
	id: string;
	eventId: string;
	data: SessionUserReview;
	idempotencyKey: string;
}

export interface DeleteSessionEventUserReviewParams {
	id: string;
	eventId: string;
	idempotencyKey: string;
}

export interface GetSessionSoundDurationParams {
	url: string;
}

export interface SessionSoundDurationParams {
	id: string;
	url: string;
}

export interface SessionSoundUploadRequest {
	captured_at: string;
}
