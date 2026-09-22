import { z } from "zod"

import { emergencyBriefSchema } from "@/apis/emergencies"
import { mockServer } from "@/apis/mock/server"
import { wordRefSchema } from "@/apis/words"

const timestamp = z.iso.datetime({ offset: true })
const clock = z.string().regex(/^\d{2}:\d{2}$/)

export const phaseSchema = z.enum(["learning", "rest", "stress_care", "sleeping"])

export const soundSchema = z.object({
	id: z.uuid(),
	session_id: z.uuid(),
	captured_at: timestamp,
	audio_url: z.string().nullable(),
	is_parrot_sound: z.boolean().nullable(),
	judgment: z.object({ word: wordRefSchema, score: z.number().min(0).max(1) }).nullable(),
	feedback: z.enum(["up", "down"]).nullable(),
})

export const runningSessionSchema = z.object({
	id: z.uuid(),
	station_device: z.object({
		id: z.uuid(),
		name: z.string().nullable(),
		model: z.string(),
		is_current: z.boolean(),
	}),
	word: wordRefSchema.nullable(),
	learning_enabled: z.boolean(),
	settings_version: z.number().int(),
	applied_settings_version: z.number().int(),
	current_phase: phaseSchema.nullable(),
	phase_started_at: timestamp.nullable(),
	started_at: timestamp,
	last_heartbeat_at: timestamp.nullable(),
	battery_level: z.number().min(0).max(1).nullable(),
	is_charging: z.boolean().nullable(),
	camera_available: z.boolean(),
	sleep_at: clock,
	wake_at: clock,
})

const sessionSchema = z.object({
	id: z.uuid(),
	status: z.enum(["running", "finished"]),
	started_at: timestamp,
	ended_at: timestamp.nullable(),
	ended_by: z.enum(["user", "server"]).nullable(),
	word: wordRefSchema.nullable(),
	learning_enabled: z.boolean(),
	play_count: z.number().int().nonnegative(),
	play_duration_ms: z.number().int().nonnegative(),
	sound_count: z.number().int().nonnegative(),
	mimicry_count: z.number().int().nonnegative(),
	emergency_count: z.number().int().nonnegative(),
	sleep_at: clock,
	wake_at: clock,
})

const sessionEventSchema = z.object({
	id: z.uuid(),
	kind: z.enum([
		"session_started",
		"learning_started",
		"learning_toggled",
		"word_changed",
		"sleep_started",
		"sleep_finished",
		"station_disconnected",
		"station_reconnected",
		"emergency_detected",
		"session_finished",
	]),
	occurred_at: timestamp,
	word: wordRefSchema.nullable(),
	learning_enabled: z.boolean().nullable(),
	emergency: emergencyBriefSchema.nullable(),
})

const timelineSchema = z.object({
	events: z.array(sessionEventSchema),
	sounds: z.array(soundSchema),
	activity: z.array(z.object({ at: timestamp, level: z.number().min(0).max(1) })),
})

export type Phase = z.infer<typeof phaseSchema>
export type Sound = z.infer<typeof soundSchema>
export type RunningSession = z.infer<typeof runningSessionSchema>
export type Session = z.infer<typeof sessionSchema>
export type SessionEvent = z.infer<typeof sessionEventSchema>
export type Timeline = z.infer<typeof timelineSchema>

export type StartSessionInput = {
	word_id: string | null
	learning_enabled: boolean
	replace_running: boolean
}

export type SessionSettingsInput = { word_id?: string; learning_enabled?: boolean }

export type HeartbeatInput = {
	applied_settings_version: number
	battery_level: number | null
	is_charging: boolean | null
	camera_available: boolean
}

export async function fetchRunningSession(): Promise<RunningSession | null> {
	return runningSessionSchema.nullable().parse(await mockServer.sessions.running())
}

export async function startSession(
	input: StartSessionInput,
	_idempotencyKey: string,
): Promise<RunningSession> {
	return runningSessionSchema.parse(await mockServer.sessions.start(input))
}

export async function finishSession(id: string, _idempotencyKey: string): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.finish(id))
}

export async function updateSessionSettings(
	id: string,
	input: SessionSettingsInput,
	_idempotencyKey: string,
): Promise<RunningSession> {
	return runningSessionSchema.parse(await mockServer.sessions.updateSettings(id, input))
}

export async function sendHeartbeat(
	id: string,
	input: HeartbeatInput,
	_idempotencyKey: string,
): Promise<RunningSession> {
	return runningSessionSchema.parse(await mockServer.sessions.heartbeat(id, input))
}

export async function fetchSessions(range: { from: Date; to: Date }): Promise<Session[]> {
	return z
		.array(sessionSchema)
		.parse(await mockServer.sessions.list(range.from.getTime(), range.to.getTime()))
}

export async function fetchSession(id: string): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.detail(id))
}

export async function fetchTimeline(id: string): Promise<Timeline> {
	return timelineSchema.parse(await mockServer.sessions.timeline(id))
}

export async function saveSoundFeedback(
	soundId: string,
	feedback: "up" | "down",
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.sessions.soundFeedback(soundId, feedback)
}
