import { z } from "zod"

import { localDate, timestamp, uuid } from "@/types/apis/primitives"
import { uploadRequestSchema } from "@/types/apis/uploads"

export const phaseSchema = z.enum(["learning", "rest", "stress_care", "sleeping"])

const sessionStatusSchema = z.enum(["running", "finished"])

const sessionSettingsSchema = z.object({
	word_id: uuid.nullable(),
	learning_enabled: z.boolean(),
	version: z.number().int(),
	applied_version: z.number().int(),
})

export const sessionSchema = z.object({
	id: uuid,
	status: sessionStatusSchema,
	station: z.object({ device_id: uuid }),
	settings: sessionSettingsSchema,
	progress: z.object({
		current_phase: phaseSchema.nullable(),
		phase_started_at: timestamp.nullable(),
		last_heartbeat_at: timestamp.nullable(),
	}),
	period: z.object({
		started_at: timestamp,
		ended_at: timestamp.nullable(),
		ended_by: z.enum(["user", "server"]).nullable(),
	}),
})

export const startSessionRequestSchema = z.object({
	word_id: uuid.nullable().optional(),
	learning_enabled: z.boolean(),
	ends_at: timestamp.nullable().optional(),
	sleep: z.object({ sleep_at: z.string(), wake_at: z.string() }).optional(),
})

export const changeWordRequestSchema = z.object({ word_id: uuid.nullable() })

export const changeLearningRequestSchema = z.object({ enabled: z.boolean() })

export const heartbeatRequestSchema = z.object({
	current_phase: phaseSchema.nullable(),
	phase_started_at: timestamp.nullable(),
	applied_settings_version: z.number().int().nonnegative(),
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
})

export const heartbeatSchema = z.object({
	session: z.object({ status: sessionStatusSchema, settings: sessionSettingsSchema }),
	acknowledged: z.array(z.object({ word_id: uuid, local_date: localDate })),
})

export const sessionEventKindSchema = z.enum([
	"session_started",
	"learning_started",
	"learning_toggled",
	"learning_finished",
	"word_changed",
	"station_disconnected",
	"station_reconnected",
	"emergency_detected",
	"session_finished",
])

export const sessionEventSchema = z.object({
	id: uuid,
	kind: sessionEventKindSchema,
	occurred_at: timestamp,
	word: z.object({ id: uuid }).nullable(),
})

export const addEventsRequestSchema = z.object({
	events: z
		.array(
			z.object({
				kind: sessionEventKindSchema,
				occurred_at: timestamp,
				word_id: uuid.nullable().optional(),
			}),
		)
		.min(1)
		.max(500),
})

export const sessionSoundSchema = z.object({
	id: uuid,
	session_id: uuid,
	captured_at: timestamp,
	audio: z.object({ url: z.string() }),
	judgment: z.object({ word_id: uuid.nullable() }).nullable(),
})

export const soundUploadRequestSchema = uploadRequestSchema.extend({ captured_at: timestamp })

export type Phase = z.infer<typeof phaseSchema>
export type Session = z.infer<typeof sessionSchema>
export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>
export type ChangeWordRequest = z.infer<typeof changeWordRequestSchema>
export type ChangeLearningRequest = z.infer<typeof changeLearningRequestSchema>
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>
export type HeartbeatSummary = HeartbeatRequest["summaries"][number]
export type Heartbeat = z.infer<typeof heartbeatSchema>
export type SessionEventKind = z.infer<typeof sessionEventKindSchema>
export type SessionEvent = z.infer<typeof sessionEventSchema>
export type AddEventsRequest = z.infer<typeof addEventsRequestSchema>
export type SessionSound = z.infer<typeof sessionSoundSchema>
export type SoundUploadRequest = z.infer<typeof soundUploadRequestSchema>
