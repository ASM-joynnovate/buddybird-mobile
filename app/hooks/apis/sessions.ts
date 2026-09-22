import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	changeLearning,
	changeWord,
	fetchEvents,
	fetchRunningSession,
	fetchSession,
	fetchSounds,
	finishSession,
	sendHeartbeat,
	startSession,
} from "@/apis/sessions"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { HeartbeatRequest, SessionSound, StartSessionRequest } from "@/types/apis/sessions"

const refreshSessions = () =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
		queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
		queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
	])

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

			return refreshSessions()
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

			return Promise.all([
				refreshSessions(),
				queryClient.invalidateQueries({ queryKey: apiKeys.reports.all() }),
			])
		},
	})

export const changeWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "word"),
		mutationFn: ({
			id,
			wordId,
			idempotencyKey,
		}: {
			id: string
			wordId: string | null
			idempotencyKey: string
		}) => changeWord(id, wordId, idempotencyKey),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session)

			return queryClient.invalidateQueries({ queryKey: apiKeys.home() })
		},
	})

export const changeLearningMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "learning"),
		mutationFn: ({
			id,
			enabled,
			idempotencyKey,
		}: {
			id: string
			enabled: boolean
			idempotencyKey: string
		}) => changeLearning(id, enabled, idempotencyKey),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session)

			return queryClient.invalidateQueries({ queryKey: apiKeys.home() })
		},
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
