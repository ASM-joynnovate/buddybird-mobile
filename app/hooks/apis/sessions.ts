import {
	type InfiniteData,
	infiniteQueryOptions,
	type QueryClient,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import {
	deleteSessionEventUserReview,
	deleteSessionSoundUserReview,
	getRunningSession,
	getSession,
	getSessionLog,
	getSessionSoundDuration,
	getSessionSummary,
	postRunningSessionFinish,
	postSession,
	postSessionFinish,
	postSessionHeartbeat,
	postSessionPetcamVideo,
	postSessionSound,
	putSessionEventUserReview,
	putSessionSoundUserReview,
} from '@/apis/sessions';
import { postSessionPetcamEventUpload, putUploadFile } from '@/apis/uploads';

import { ApiError, type Page } from '@/types/apis/common';
import type {
	SessionLogItem,
	SessionLogKind,
	SessionSoundDurationParams,
	SessionUserReview,
} from '@/types/apis/sessions';

import { apiKeys } from '@/hooks/apis/keys';
import { deviceKeys } from '@/hooks/apis/keys/devices';
import { homeKeys } from '@/hooks/apis/keys/home';
import { reportKeys } from '@/hooks/apis/keys/reports';
import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { nextPageNumber } from '@/lib/api';

import { reportError } from '@/services/telemetry/client';

/** 캐시의 세션 기록 리뷰 변경 함수 */
const setCachedSessionLogReview = (
	queryClient: QueryClient,
	{ id, itemId }: { id: string; itemId: string },
	userReview: SessionUserReview | null,
) => {
	queryClient.setQueriesData<InfiniteData<Page<SessionLogItem>>>(
		{ queryKey: sessionKeys.log(id) },
		(logData) =>
			logData && {
				...logData,
				pages: logData.pages.map((logPage) => ({
					...logPage,
					data: logPage.data.map((logItem) =>
						logItem.id === itemId ? { ...logItem, user_review: userReview } : logItem,
					),
				})),
			},
	);
};

/** 저장 요청 전에 캐시의 기록 리뷰를 먼저 변경하는 함수 */
const patchCachedSessionLogReview = async (
	queryClient: QueryClient,
	{ id, itemId }: { id: string; itemId: string },
	userReview: SessionUserReview | null,
) => {
	await queryClient.cancelQueries({ queryKey: sessionKeys.log(id) });

	const previousReview =
		queryClient
			.getQueriesData<InfiniteData<Page<SessionLogItem>>>({ queryKey: sessionKeys.log(id) })
			.flatMap(([, logData]) => logData?.pages.flatMap((logPage) => logPage.data) ?? [])
			.find((logItem) => logItem.id === itemId)?.user_review ?? null;

	setCachedSessionLogReview(queryClient, { id, itemId }, userReview);

	return { previousReview };
};

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

/** 세션 기록 조회 Hook에 사용할 옵션 */
export const getSessionLogOptions = ({ id, kinds }: { id: string; kinds: SessionLogKind[] }) =>
	infiniteQueryOptions({
		queryKey: sessionKeys.logByKinds(id, kinds),
		queryFn: ({ pageParam }) => getSessionLog({ id, kinds, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: nextPageNumber,
	});
/** 세션 기록 조회 Hook */
export const useGetSessionLog = ({ id, kinds }: { id: string; kinds: SessionLogKind[] }) => {
	return useSuspenseInfiniteQuery(getSessionLogOptions({ id, kinds }));
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
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.log(id) }),
	});
};

/** 세션 소리 리뷰 Hook */
export const useReviewSessionSound = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'soundReview', 'update'),
		mutationFn: putSessionSoundUserReview,
		onMutate: ({ id, soundId, data }) => patchCachedSessionLogReview(queryClient, { id, itemId: soundId }, data),
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.log(id) }),
		onError: (_error, { id, soundId }, context) => {
			if (context) {
				setCachedSessionLogReview(queryClient, { id, itemId: soundId }, context.previousReview);
			}
		},
	});
};

/** 세션 소리 리뷰 취소 Hook */
export const useCancelSessionSoundReview = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'soundReview', 'delete'),
		mutationFn: deleteSessionSoundUserReview,
		onMutate: ({ id, soundId }) => patchCachedSessionLogReview(queryClient, { id, itemId: soundId }, null),
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.log(id) }),
		onError: (_error, { id, soundId }, context) => {
			if (context) {
				setCachedSessionLogReview(queryClient, { id, itemId: soundId }, context.previousReview);
			}
		},
	});
};

/** 세션 이벤트 리뷰 Hook */
export const useReviewSessionEvent = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'eventReview', 'update'),
		mutationFn: putSessionEventUserReview,
		onMutate: ({ id, eventId, data }) => patchCachedSessionLogReview(queryClient, { id, itemId: eventId }, data),
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.log(id) }),
		onError: (_error, { id, eventId }, context) => {
			if (context) {
				setCachedSessionLogReview(queryClient, { id, itemId: eventId }, context.previousReview);
			}
		},
	});
};

/** 세션 이벤트 리뷰 취소 Hook */
export const useCancelSessionEventReview = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('sessions', 'eventReview', 'delete'),
		mutationFn: deleteSessionEventUserReview,
		onMutate: ({ id, eventId }) => patchCachedSessionLogReview(queryClient, { id, itemId: eventId }, null),
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: sessionKeys.log(id) }),
		onError: (_error, { id, eventId }, context) => {
			if (context) {
				setCachedSessionLogReview(queryClient, { id, itemId: eventId }, context.previousReview);
			}
		},
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
