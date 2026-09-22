import { z } from "zod"

import { mockServer } from "@/mocks/server"
import { type Page, pageMetaSchema } from "@/types/apis/common"
import {
	type AddEventsRequest,
	type Heartbeat,
	type HeartbeatRequest,
	heartbeatSchema,
	type Session,
	type SessionEvent,
	sessionEventSchema,
	sessionSchema,
	type SessionSound,
	sessionSoundSchema,
	type StartSessionRequest,
} from "@/types/apis/sessions"

export async function fetchSessionsPage(page: number): Promise<Page<Session>> {
	const { data, meta } = await mockServer.sessions.list(page)

	return { data: z.array(sessionSchema).parse(data), meta: pageMetaSchema.parse(meta) }
}

export async function fetchRunningSession(): Promise<Session | null> {
	const { data } = await fetchSessionsPage(1)

	return data.find((session) => session.status === "running") ?? null
}

export async function fetchSession(id: string): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.detail(id))
}

export async function startSession(
	input: StartSessionRequest,
	_idempotencyKey: string,
): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.start(input))
}

export async function finishSession(id: string, _idempotencyKey: string): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.finish(id))
}

export async function changeWord(
	id: string,
	wordId: string | null,
	_idempotencyKey: string,
): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.changeWord(id, wordId))
}

export async function changeLearning(
	id: string,
	enabled: boolean,
	_idempotencyKey: string,
): Promise<Session> {
	return sessionSchema.parse(await mockServer.sessions.changeLearning(id, enabled))
}

export async function sendHeartbeat(
	id: string,
	input: HeartbeatRequest,
	_idempotencyKey: string,
): Promise<Heartbeat> {
	return heartbeatSchema.parse(await mockServer.sessions.heartbeat(id, input))
}

export async function addEvents(
	id: string,
	input: AddEventsRequest,
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.sessions.addEvents(id, input)
}

export async function fetchEvents(id: string): Promise<SessionEvent[]> {
	return z.array(sessionEventSchema).parse(await mockServer.sessions.events(id))
}

export async function fetchSounds(id: string, page: number): Promise<Page<SessionSound>> {
	const { data, meta } = await mockServer.sessions.sounds(id, page)

	return { data: z.array(sessionSoundSchema).parse(data), meta: pageMetaSchema.parse(meta) }
}
