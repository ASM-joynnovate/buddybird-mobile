import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	disconnectDevice,
	fetchActivity,
	fetchDeviceNames,
	fetchEventExtras,
	fetchNoticeNotifications,
	fetchRecordingStatus,
	fetchSessionPlays,
	fetchSessionsInRange,
	fetchSoundAnalysis,
	fetchSoundFeedback,
	renameDevice,
	saveSoundFeedback,
} from "@/apis/mocks"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const sessionsInRangeQueryOptions = (from: Date, to: Date) =>
	queryOptions({
		queryKey: apiKeys.sessions.range(from.toISOString(), to.toISOString()),
		queryFn: () => fetchSessionsInRange(from, to),
	})

export const activityQueryOptions = (sessionId: string) =>
	queryOptions({
		queryKey: apiKeys.mocks.activity(sessionId),
		queryFn: () => fetchActivity(sessionId),
	})

export const sessionPlaysQueryOptions = (sessionId: string) =>
	queryOptions({
		queryKey: apiKeys.mocks.plays(sessionId),
		queryFn: () => fetchSessionPlays(sessionId),
	})

export const eventExtrasQueryOptions = (sessionId: string) =>
	queryOptions({
		queryKey: apiKeys.mocks.eventExtras(sessionId),
		queryFn: () => fetchEventExtras(sessionId),
	})

export const soundFeedbackQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.mocks.soundFeedback(), queryFn: fetchSoundFeedback })

export const soundAnalysisQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.mocks.soundAnalysis(), queryFn: fetchSoundAnalysis })

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
				queryClient.invalidateQueries({ queryKey: apiKeys.mocks.soundFeedback() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.reports.all() }),
			]),
	})

export const deviceNamesQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.mocks.deviceNames(), queryFn: fetchDeviceNames })

export const renameDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "rename"),
		mutationFn: ({
			id,
			name,
			idempotencyKey,
		}: {
			id: string
			name: string | null
			idempotencyKey: string
		}) => renameDevice(id, name, idempotencyKey),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
	})

export const disconnectDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "disconnect"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			disconnectDevice(id, idempotencyKey),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})

export const recordingStatusQueryOptions = (wordId: string) =>
	queryOptions({
		queryKey: apiKeys.mocks.recordingStatus(wordId),
		queryFn: () => fetchRecordingStatus(wordId),
	})

export const noticeNotificationsQueryOptions = () =>
	queryOptions({
		queryKey: apiKeys.mocks.noticeNotifications(),
		queryFn: fetchNoticeNotifications,
	})
