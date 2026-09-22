import { z } from "zod"

import type { AppNotification } from "@/types/apis/notifications"
import { localDate, timestamp, uuid } from "@/types/apis/primitives"
import {
	type Session,
	type SessionEventKind,
	type SessionSound,
	sessionSoundSchema,
} from "@/types/apis/sessions"
import type { SleepSettings } from "@/types/apis/settings"

export const MAX_DEVICE_NAME = 30

const wordRefSchema = z.object({ id: uuid, name: z.string() })

export const reportPeriodSchema = z.enum(["day", "week", "month"])

export const reportSchema = z.object({
	period: reportPeriodSchema,
	start: localDate,
	end: localDate,
	total_play_count: z.number().int().nonnegative(),
	total_play_duration_ms: z.number().int().nonnegative(),
	mimicry_count: z.number().int().nonnegative(),
	trend: z.array(
		z.object({ start: timestamp, play_duration_ms: z.number().int().nonnegative() }),
	),
	words: z.array(z.object({ word: wordRefSchema, play_count: z.number().int().nonnegative() })),
	sounds: z.array(sessionSoundSchema),
})

export const emergencyKindSchema = z.enum([
	"audio_cry",
	"video_escape",
	"video_no_motion",
	"video_seizure",
])

export const emergencyBriefSchema = z.object({
	id: uuid,
	session_id: uuid,
	kind: emergencyKindSchema,
	detected_at: timestamp,
})

export const emergencySchema = emergencyBriefSchema.extend({
	media: z.object({ type: z.enum(["audio", "video"]), url: z.string() }).nullable(),
	is_confirmed: z.boolean(),
	session_running: z.boolean(),
})

export const homeExtrasSchema = z.object({
	streak_days: z.number().int().nonnegative(),
	unconfirmed_emergency: emergencyBriefSchema.nullable(),
})

export const stationStatusSchema = z.object({
	battery_level: z.number().min(0).max(1).nullable(),
	is_charging: z.boolean().nullable(),
	camera_available: z.boolean(),
})

export const soundFeedbackSchema = z.object({
	sound_id: uuid,
	feedback: z.enum(["up", "down"]).nullable(),
})

export const soundAnalysisSchema = z.object({
	sound_id: uuid,
	is_parrot_sound: z.boolean().nullable(),
	score: z.number().min(0).max(1).nullable(),
})

export const activitySchema = z.object({ at: timestamp, level: z.number().min(0).max(1) })

export const sessionPlaysSchema = z.object({
	play_count: z.number().int().nonnegative(),
	play_duration_ms: z.number().int().nonnegative(),
})

export const eventExtrasSchema = z.object({
	event_details: z.array(
		z.object({
			event_id: uuid,
			learning_enabled: z.boolean().nullable(),
			emergency: emergencyBriefSchema.nullable(),
		}),
	),
	sleep_events: z.array(
		z.object({
			id: uuid,
			kind: z.enum(["sleep_started", "sleep_finished"]),
			occurred_at: timestamp,
		}),
	),
})

export const deviceNameSchema = z.object({
	device_id: uuid,
	name: z.string().max(MAX_DEVICE_NAME).nullable(),
})

export const recordingStatusSchema = z.object({
	recording_id: uuid,
	duration_ms: z.number().int().nonnegative(),
	status: z.enum(["processing", "ready"]),
})

export const noticeNotificationSchema = z.object({
	id: uuid,
	kind: z.literal("notice"),
	notice_id: uuid,
	title: z.string(),
	body: z.string(),
	sent_at: timestamp,
	read_at: timestamp.nullable(),
})

export const noticeNotificationsSchema = z.object({
	notices: z.array(noticeNotificationSchema),
	notification_sessions: z.array(z.object({ notification_id: uuid, session_id: uuid })),
})

export const appUpdateSchema = z.object({
	latest_version: z.string(),
	min_supported_version: z.string(),
	release_notes: z.object({
		ko: z.array(z.string()).optional(),
		en: z.array(z.string()).optional(),
	}),
})

export type ReportPeriod = z.infer<typeof reportPeriodSchema>
export type Report = z.infer<typeof reportSchema>
export type EmergencyKind = z.infer<typeof emergencyKindSchema>
export type EmergencyBrief = z.infer<typeof emergencyBriefSchema>
export type Emergency = z.infer<typeof emergencySchema>
export type AppUpdate = z.infer<typeof appUpdateSchema>
export type HomeExtras = z.infer<typeof homeExtrasSchema>
export type StationStatus = z.infer<typeof stationStatusSchema>
export type SoundFeedback = z.infer<typeof soundFeedbackSchema>
export type SoundAnalysis = z.infer<typeof soundAnalysisSchema>
export type Activity = z.infer<typeof activitySchema>
export type SessionPlays = z.infer<typeof sessionPlaysSchema>
export type EventExtras = z.infer<typeof eventExtrasSchema>
export type DeviceName = z.infer<typeof deviceNameSchema>
export type RecordingStatus = z.infer<typeof recordingStatusSchema>
export type NoticeNotification = z.infer<typeof noticeNotificationSchema>
export type NoticeNotifications = z.infer<typeof noticeNotificationsSchema>
export type InboxNotification = AppNotification | NoticeNotification

export type TimelineEvent = {
	id: string
	kind: SessionEventKind | "sleep_started" | "sleep_finished"
	occurred_at: string
	word: { id: string; name: string } | null
	learning_enabled: boolean | null
	emergency: EmergencyBrief | null
}

export type TimelineSound = SessionSound & {
	wordName: string | null
	analysis: SoundAnalysis | null
}

export type SessionTimeline = {
	events: TimelineEvent[]
	sounds: TimelineSound[]
	activity: Activity[]
}

export type SessionRecord = {
	session: Session
	wordName: string | null
	sleep: SleepSettings
	playCount: number
	mimicryCount: number
	emergencyCount: number
}
