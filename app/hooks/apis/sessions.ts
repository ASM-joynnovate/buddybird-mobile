import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
	getAllSessionSounds,
	getRunningSession,
	getSession,
	postSession,
	postSessionFinish,
	postSessionHeartbeat,
	postSessionSound,
} from '@/apis/sessions';

import type { HeartbeatRequest, StartSessionRequest } from '@/types/apis/sessions';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

import { queryClient } from '@/lib/query-client';

export const runningSessionQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.sessions.running(), queryFn: getRunningSession });

export const sessionQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.detail(id), queryFn: () => getSession({ id }) });

export const sessionSoundsQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.sessions.sounds(id), queryFn: () => getAllSessionSounds({ id }) });

export const startSessionMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('sessions', 'start'),
		mutationFn: ({ data, idempotencyKey }: { data: StartSessionRequest; idempotencyKey: string }) =>
			postSession({ data, idempotencyKey }),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session);

			return invalidate(apiKeys.sessions.all(), apiKeys.home(), apiKeys.devices());
		},
	});

export const finishSessionMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('sessions', 'finish'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			postSessionFinish({ id, idempotencyKey }),
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), null);
			queryClient.setQueryData(apiKeys.sessions.detail(session.id), session);

			return invalidate(apiKeys.sessions.all(), apiKeys.home(), apiKeys.devices(), apiKeys.reports.all());
		},
	});

export const uploadSoundMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('sessions', 'sounds'),
		mutationFn: ({
			sessionId,
			uri,
			capturedAt,
			idempotencyKey,
		}: {
			sessionId: string;
			uri: string;
			capturedAt: string;
			idempotencyKey: string;
		}) => postSessionSound({ id: sessionId, uri, data: { captured_at: capturedAt }, idempotencyKey }),
		onSuccess: (_data, { sessionId }) => invalidate(apiKeys.sessions.sounds(sessionId)),
	});

export const heartbeatMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('sessions', 'heartbeat'),
		mutationFn: ({ id, data, idempotencyKey }: { id: string; data: HeartbeatRequest; idempotencyKey: string }) =>
			postSessionHeartbeat({ id, data, idempotencyKey }),
		retry: false,
		onSuccess: () => invalidate(apiKeys.sessions.running()),
	});
