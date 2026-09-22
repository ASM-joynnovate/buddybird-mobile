import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	fetchRunningSession,
	fetchSession,
	fetchSessions,
	fetchTimeline,
	finishSession,
	type HeartbeatInput,
	saveSoundFeedback,
	sendHeartbeat,
	type SessionSettingsInput,
	startSession,
	type StartSessionInput,
	updateSessionSettings,
} from "@/apis/sessions"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

const refreshSessions = () =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
		queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
		queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
	])

export const runningSessionQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.sessions.running(), queryFn: fetchRunningSession })

export const sessionsQueryOptions = (from: Date, to: Date) =>
	queryOptions({
		queryKey: apiKeys.sessions.range(from.toISOString(), to.toISOString()),
		queryFn: () => fetchSessions({ from, to }),
	})

export const sessionQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.detail(id), queryFn: () => fetchSession(id) })

export const timelineQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.timeline(id), queryFn: () => fetchTimeline(id) })

export const startSessionMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "start"),
		mutationFn: ({
			input,
			idempotencyKey,
		}: {
			input: StartSessionInput
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

export const updateSessionSettingsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sessions", "settings"),
		mutationFn: ({
			id,
			input,
			idempotencyKey,
		}: {
			id: string
			input: SessionSettingsInput
			idempotencyKey: string
		}) => updateSessionSettings(id, input, idempotencyKey),
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
			input: HeartbeatInput
			idempotencyKey: string
		}) => sendHeartbeat(id, input, idempotencyKey),
		retry: false,
		onSuccess: (session) => queryClient.setQueryData(apiKeys.sessions.running(), session),
	})

export const soundFeedbackMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("sounds", "feedback"),
		mutationFn: ({
			soundId,
			feedback,
			idempotencyKey,
		}: {
			soundId: string
			feedback: "up" | "down"
			idempotencyKey: string
		}) => saveSoundFeedback(soundId, feedback, idempotencyKey),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.reports.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})
