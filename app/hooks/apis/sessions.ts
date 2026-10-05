import {
	infiniteQueryOptions,
	queryOptions,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import {
	getRunningSession,
	getSession,
	getSessionMimicrySoundList,
	getSessionSummary,
	postRunningSessionFinish,
	postSession,
	postSessionFinish,
	postSessionHeartbeat,
	postSessionSound,
} from '@/apis/sessions';

import { ApiError } from '@/types/apis/common';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 진행 중인 세션 조회 Hook에 사용할 옵션 */
export const getRunningSessionOptions = () =>
	queryOptions({ queryKey: apiKeys.sessions.running(), queryFn: getRunningSession });
/** 진행 중인 세션 조회 Hook */
export const useGetRunningSession = () => {
	return useSuspenseQuery(getRunningSessionOptions());
};

/** 세션 상세 조회 Hook에 사용할 옵션 */
export const getSessionOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.sessions.detail(id), queryFn: () => getSession({ id }) });
/** 세션 상세 조회 Hook */
export const useGetSession = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionOptions({ id }));
};

/** 세션 요약 조회 Hook에 사용할 옵션 */
export const getSessionSummaryOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.sessions.summary(id), queryFn: () => getSessionSummary({ id }) });
/** 세션 요약 조회 Hook */
export const useGetSessionSummary = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionSummaryOptions({ id }));
};

/** 앵무새가 따라 한 소리 목록 조회 Hook에 사용할 옵션 */
export const getSessionMimicrySoundListOptions = ({ id }: { id: string }) =>
	infiniteQueryOptions({
		queryKey: apiKeys.sessions.mimicrySounds(id),
		queryFn: ({ pageParam }) => getSessionMimicrySoundList({ id, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});
/** 앵무새가 따라 한 소리 목록 조회 Hook */
export const useGetSessionMimicrySoundList = ({ id }: { id: string }) => {
	return useSuspenseInfiniteQuery(getSessionMimicrySoundListOptions({ id }));
};

/** 세션 시작 Hook */
export const useStartSession = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'start'),
		mutationFn: postSession,
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), session);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
			]);
		},
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__ALREADY_RUNNING') {
				return;
			}

			reportError(error, 'session_start');
		},
	});
};

/** 세션 종료 Hook */
export const useFinishSession = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'finish'),
		mutationFn: postSessionFinish,
		onSuccess: (session) => {
			queryClient.setQueryData(apiKeys.sessions.running(), null);
			queryClient.setQueryData(apiKeys.sessions.detail(session.id), session);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.reports.all() }),
			]);
		},
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
				return;
			}

			reportError(error, 'session_finish');
		},
	});
};

/** 진행 중인 세션을 찾아 종료하는 Hook */
export const useFinishRunningSession = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'finishRunning'),
		mutationFn: postRunningSessionFinish,
		onSuccess: () => {
			queryClient.setQueryData(apiKeys.sessions.running(), null);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.reports.all() }),
			]);
		},
		onError: (error) => {
			if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
				return;
			}

			reportError(error, 'session_takeover');
		},
	});
};

/** 세션 소리 업로드 Hook */
export const useUploadSessionSound = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'sounds'),
		mutationFn: postSessionSound,
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.mimicrySounds(id) }),
	});
};

/** 하트비트 전송 Hook */
export const useSendHeartbeat = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'heartbeat'),
		mutationFn: postSessionHeartbeat,
		retry: false,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.running() }),
		onError: (error) => {
			if (
				error instanceof ApiError &&
				(error.code === 'SESSION__NOT_RUNNING' || error.code === 'DEVICE__NOT_REGISTERED')
			) {
				return;
			}

			reportError(error, 'session_heartbeat');
		},
	});
};
