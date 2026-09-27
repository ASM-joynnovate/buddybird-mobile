import { z } from "zod"

import { mockServer } from "@/mocks/server"
import {
	type Activity,
	activitySchema,
	type EventExtras,
	eventExtrasSchema,
	type RecordingStatus,
	recordingStatusSchema,
	type SessionPlays,
	type SoundAnalysis,
	soundAnalysisSchema,
	sessionPlaysSchema,
	type SoundFeedback,
	soundFeedbackSchema,
} from "@/mocks/types"
import { type Session, sessionSchema } from "@/types/apis/sessions"
import type { Upload } from "@/types/apis/uploads"

export async function putUpload(upload: Upload, uri: string, durationMs?: number): Promise<void> {
	await mockServer.uploads.put(upload.file_id, uri, durationMs)
}

export async function fetchSessionsInRange(from: Date, to: Date): Promise<Session[]> {
	return z
		.array(sessionSchema)
		.parse(await mockServer.sessions.range(from.getTime(), to.getTime()))
}

export async function fetchActivity(sessionId: string): Promise<Activity[]> {
	return z.array(activitySchema).parse(await mockServer.sessions.activity(sessionId))
}

export async function fetchSessionPlays(sessionId: string): Promise<SessionPlays> {
	return sessionPlaysSchema.parse(await mockServer.sessions.plays(sessionId))
}

export async function fetchEventExtras(sessionId: string): Promise<EventExtras> {
	return eventExtrasSchema.parse(await mockServer.sessions.eventExtras(sessionId))
}

export async function fetchSoundFeedback(): Promise<SoundFeedback[]> {
	return z.array(soundFeedbackSchema).parse(await mockServer.sounds.feedback())
}

export async function fetchSoundAnalysis(): Promise<SoundAnalysis[]> {
	return z.array(soundAnalysisSchema).parse(await mockServer.sounds.analysis())
}

export async function saveSoundFeedback(
	soundId: string,
	feedback: "up" | "down",
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.sounds.saveFeedback(soundId, feedback)
}

export async function fetchRecordingStatus(wordId: string): Promise<RecordingStatus[]> {
	return z.array(recordingStatusSchema).parse(await mockServer.words.recordingStatus(wordId))
}
