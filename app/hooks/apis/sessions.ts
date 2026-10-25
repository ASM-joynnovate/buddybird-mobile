import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import {
	getRunningSession,
	getSession,
	getSessionEventList,
	getSessionSoundDuration,
	getSessionSoundList,
	getSessionSummary,
	postRunningSessionFinish,
	postSession,
	postSessionFinish,
	postSessionHeartbeat,
	postSessionPetcamVideo,
	postSessionSound,
} from '@/apis/sessions';
import { postSessionPetcamEventUpload, putUploadFile } from '@/apis/uploads';

import { ApiError } from '@/types/apis/common';
import type { SessionSoundDurationParams } from '@/types/apis/sessions';

import { apiKeys } from '@/hooks/apis/keys';
import { deviceKeys } from '@/hooks/apis/keys/devices';
import { homeKeys } from '@/hooks/apis/keys/home';
import { reportKeys } from '@/hooks/apis/keys/reports';
import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { nextPageNumber } from '@/lib/api';

import { reportError } from '@/services/telemetry/client';

/** 진행 중인 세션 조회 Hook에 사용할 옵션 */
export const getRunningSessionOptions = () =>
	queryOptions({ queryKey: sessionKeys.running(), queryFn: getRunningSession });
/** 진행 중인 세션 조회 Hook */
export const useGetRunningSession = () => {
	return useSuspenseQuery(getRunningSessionOptions());
};
/** suspense 없는 진행 중인 세션 조회 Hook */
export const useGetRunningSessionQuery = () => {
	return useQuery(getRunningSessionOptions());
};

/** 세션 상세 조회 Hook에 사용할 옵션 */
export const getSessionOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: sessionKeys.detail(id), queryFn: () => getSession({ id }) });
/** 세션 상세 조회 Hook */
export const useGetSession = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionOptions({ id }));
};
/** suspense 없는 세션 상세 조회 Hook */
export const useGetSessionQuery = (
	{ id }: { id: string },
	options?: Pick<ReturnType<typeof getSessionOptions>, 'staleTime' | 'refetchInterval'>,
) => {
	return useQuery({ ...getSessionOptions({ id }), ...options });
};

/** 세션 요약 조회 Hook에 사용할 옵션 */
export const getSessionSummaryOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: sessionKeys.summary(id), queryFn: () => getSessionSummary({ id }) });
/** 세션 요약 조회 Hook */
export const useGetSessionSummary = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionSummaryOptions({ id }));
};

/** 세션 소리 목록 조회 Hook에 사용할 옵션 */
export const getSessionSoundListOptions = ({ id }: { id: string }) =>
	infiniteQueryOptions({
		queryKey: sessionKeys.sounds(id),
		queryFn: ({ pageParam }) => getSessionSoundList({ id, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: nextPageNumber,
	});
/** 세션 소리 목록 조회 Hook */
export const useGetSessionSoundList = ({ id }: { id: string }) => {
	return useSuspenseInfiniteQuery(getSessionSoundListOptions({ id }));
};

/** 세션 소리 재생 길이 조회 Hook에 사용할 옵션 */
export const getSessionSoundDurationOptions = ({ id, url }: SessionSoundDurationParams) =>
	// oxlint-disable-next-line @tanstack/query/exhaustive-deps
	queryOptions({
		queryKey: sessionKeys.soundDuration(id),
		queryFn: () =>
			getSessionSoundDuration({ url }).catch((error: unknown) => {
				reportError(error, 'session_sound_duration');

				throw error;
			}),
		staleTime: Infinity,
	});
/** suspense 없는 세션 소리 재생 길이 조회 Hook */
export const useGetSessionSoundDurationQuery = (
	{ id, url }: SessionSoundDurationParams,
	options?: Pick<ReturnType<typeof getSessionSoundDurationOptions>, 'enabled'>,
) => {
	return useQuery({ ...getSessionSoundDurationOptions({ id, url }), ...options });
};

/** 세션 이벤트 목록 조회 Hook에 사용할 옵션 */
export const getSessionEventListOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: sessionKeys.events(id), queryFn: () => getSessionEventList({ id }) });
/** 세션 이벤트 목록 조회 Hook */
export const useGetSessionEventList = ({ id }: { id: string }) => {
	return useSuspenseQuery(getSessionEventListOptions({ id }));
};

/** 세션 시작 Hook */
export const useStartSession = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'start'),
		mutationFn: postSession,
		onSuccess: (session) => {
			queryClient.setQueryData(sessionKeys.running(), session);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: sessionKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
				queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
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
			queryClient.setQueryData(sessionKeys.running(), null);
			queryClient.setQueryData(sessionKeys.detail(session.id), session);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: sessionKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
				queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
				queryClient.invalidateQueries({ queryKey: reportKeys.all() }),
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
			queryClient.setQueryData(sessionKeys.running(), null);

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: sessionKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
				queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
				queryClient.invalidateQueries({ queryKey: reportKeys.all() }),
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
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.sounds(id) }),
	});
};

/** 펫캠 이벤트 사진 업로드 URL 발급 Hook */
export const useIssuePetcamEventUpload = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'petcamEventUpload'),
		mutationFn: postSessionPetcamEventUpload,
		retry: false,
	});
};

/** 펫캠 사진 업로드 Hook */
export const useUploadPetcamPhoto = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'petcamPhoto'),
		mutationFn: putUploadFile,
		retry: false,
	});
};

/** 펫캠 영상 업로드 Hook */
export const useUploadPetcamVideo = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'petcamVideo'),
		mutationFn: postSessionPetcamVideo,
		retry: false,
	});
};

/** 하트비트 전송 Hook */
export const useSendHeartbeat = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'heartbeat'),
		mutationFn: postSessionHeartbeat,
		retry: false,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.running() }),
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
