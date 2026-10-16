import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
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

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { shareFile, shareJoinedWav } from '@/services/media/share';
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

/** 세션 소리 목록 조회 Hook에 사용할 옵션 */
export const getSessionSoundListOptions = ({ id }: { id: string }) =>
	infiniteQueryOptions({
		queryKey: apiKeys.sessions.sounds(id),
		queryFn: ({ pageParam }) => getSessionSoundList({ id, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});
/** 세션 소리 목록 조회 Hook */
export const useGetSessionSoundList = ({ id }: { id: string }) => {
	return useSuspenseInfiniteQuery(getSessionSoundListOptions({ id }));
};

/** 세션 소리 재생 길이 조회 Hook에 사용할 옵션 */
export const getSessionSoundDurationOptions = ({ id, url }: { id: string; url: string }) =>
	// oxlint-disable-next-line @tanstack/query/exhaustive-deps
	queryOptions({
		queryKey: apiKeys.sessionSounds.duration(id),
		queryFn: () =>
			getSessionSoundDuration({ url }).catch((error: unknown) => {
				reportError(error, 'session_sound_duration');

				throw error;
			}),
		staleTime: Infinity,
	});

/** 세션 이벤트 목록 조회 Hook에 사용할 옵션 */
export const getSessionEventListOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.sessions.events(id), queryFn: () => getSessionEventList({ id }) });
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
		onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.sounds(id) }),
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

/** 세션 기록 파일 공유 Hook */
export const useShareSessionFile = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'shareFile'),
		mutationFn: shareFile,
		onError: (error) => reportError(error, 'session_file_share'),
	});
};

/** 이어 붙인 세션 소리 공유 Hook */
export const useShareSessionJoinedSound = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'shareJoinedSound'),
		mutationFn: shareJoinedWav,
		onError: (error) => reportError(error, 'parrot_sound_share'),
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
