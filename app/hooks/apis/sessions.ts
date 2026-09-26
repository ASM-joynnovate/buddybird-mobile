import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	fetchEvents,
	fetchRunningSession,
	fetchSession,
	fetchSounds,
	finishSession,
	sendHeartbeat,
	startSession,
	uploadSound,
} from "@/apis/sessions"
import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { HeartbeatRequest, SessionSound, StartSessionRequest } from "@/types/apis/sessions"

async function fetchAllSounds(id: string): Promise<SessionSound[]> {
	const sounds: SessionSound[] = []

	for (let page = 1; ; page++) {
		const result = await fetchSounds(id, page)

		sounds.push(...result.data)

		if (result.meta.is_last) {
			return sounds
		}
	}
}

export const runningSessionQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.sessions.running(), queryFn: fetchRunningSession })

export const sessionQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.detail(id), queryFn: () => fetchSession(id) })

export const sessionEventsQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.events(id), queryFn: () => fetchEvents(id) })

export const sessionSoundsQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.sounds(id), queryFn: () => fetchAllSounds(id) })

export const startSessionMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "start"),
		mutationFn: ({
			input,
			idempotencyKey,
		}: {
			input: StartSessionRequest
			idempotencyKey: string
		}) => startSession(input, idempotencyKey),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session)

			return invalidate(apiKeys.sessions.all(), apiKeys.home(), apiKeys.devices())
		},
	})

export const finishSessionMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "finish"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			finishSession(id, idempotencyKey),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), null)
			queryClient.setQueryData(apiKeys.sessions.detail(session.id), session)

			return invalidate(
				apiKeys.sessions.all(),
				apiKeys.home(),
				apiKeys.devices(),
				apiKeys.reports.all(),
			)
		},
	})

export const uploadSoundMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "sounds"),
		mutationFn: ({
			sessionId,
			uri,
			capturedAt,
			idempotencyKey,
		}: {
			sessionId: string
			uri: string
			capturedAt: string
			idempotencyKey: string
		}) => uploadSound(sessionId, uri, capturedAt, idempotencyKey),
		onSuccess: (_data, { sessionId }) =>
			queryClient.invalidateQueries({ queryKey: apiKeys.sessions.sounds(sessionId) }),
	})

export const heartbeatMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "heartbeat"),
		mutationFn: ({
			id,
			input,
			idempotencyKey,
		}: {
			id: string
			input: HeartbeatRequest
			idempotencyKey: string
		}) => sendHeartbeat(id, input, idempotencyKey),
		retry: false,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.running() }),
	})
