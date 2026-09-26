import { z } from "zod"

import type { AppNotification } from "@/types/apis/notifications"
import { timestamp, uuid } from "@/types/apis/primitives"
import type { Session, SessionEventKind, SessionSound } from "@/types/apis/sessions"
import type { SleepSettings } from "@/types/apis/settings"

export const MAX_DEVICE_NAME = 30

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
	release_notes: z.array(z.string()),
})

export type AppUpdate = z.infer<typeof appUpdateSchema>
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

export type TimelineEventKind =
	| Exclude<SessionEventKind, "learning_toggled" | "word_changed" | "emergency_detected">
	| "sleep_started"
	| "sleep_finished"

export type TimelineEvent = {
	id: string
	kind: TimelineEventKind
	occurred_at: string
	word: { id: string; name: string } | null
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
}
