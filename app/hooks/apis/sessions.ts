import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import {
	getAllSessionSounds,
	getRunningSession,
	getSession,
	postSession,
	postSessionFinish,
	postSessionHeartbeat,
	postSessionSound,
} from '@/apis/sessions';

import { ApiError } from '@/types/apis/common';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { queryClient } from '@/lib/query-client';

import { reportError } from '@/services/telemetry/client';

/** 진행 중 세션 조회 옵션 */
export const getRunningSessionOptions = () =>
	queryOptions({ queryKey: apiKeys.sessions.running(), queryFn: getRunningSession });
/** 진행 중 세션 조회 훅 */
export const useGetRunningSession = () => {
	return useSuspenseQuery(getRunningSessionOptions());
};

/** 세션 조회 옵션 */
export const getSessionOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.sessions.detail(id), queryFn: () => getSession({ id }) });
/** 세션 조회 훅 */
export const useGetSession = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionOptions({ id }));
};

/** 세션 소리 목록 조회 옵션 */
export const getSessionSoundListOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.sessions.sounds(id), queryFn: () => getAllSessionSounds({ id }) });
/** 세션 소리 목록 조회 훅 */
export const useGetSessionSoundList = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionSoundListOptions({ id }));
};

/** 세션 시작 훅 */
export const useStartSession = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'start'),
		mutationFn: postSession,
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session);

			return invalidate(apiKeys.sessions.all(), apiKeys.home(), apiKeys.devices());
		},
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__ALREADY_RUNNING') {
				return;
			}

			reportError(error, 'session_start');
		},
	});
};

/** 세션 종료 훅 */
export const useFinishSession = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'finish'),
		mutationFn: postSessionFinish,
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), null);
			queryClient.setQueryData(apiKeys.sessions.detail(session.id), session);

			return invalidate(apiKeys.sessions.all(), apiKeys.home(), apiKeys.devices(), apiKeys.reports.all());
		},
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
				return;
			}

			reportError(error, 'session_finish');
		},
	});
};

/** 세션 소리 업로드 훅 */
export const useUploadSessionSound = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'sounds'),
		mutationFn: postSessionSound,
		onSuccess: (_data, { id }) => invalidate(apiKeys.sessions.sounds(id)),
	});
};

/** 하트비트 전송 훅 */
export const useSendHeartbeat = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'heartbeat'),
		mutationFn: postSessionHeartbeat,
		retry: false,
		onSuccess: () => invalidate(apiKeys.sessions.running()),
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
				return;
			}

			reportError(error, 'session_heartbeat');
		},
	});
};
