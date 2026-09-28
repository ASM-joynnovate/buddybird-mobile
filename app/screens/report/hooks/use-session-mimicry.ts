import { useQuery } from '@tanstack/react-query';

import type { SessionSound } from '@/types/apis/sessions';

import { getSessionOptions, getSessionSoundListOptions } from '@/hooks/apis/sessions';
import { getWordListOptions } from '@/hooks/apis/words';

import { useIsFocused } from '@react-navigation/native';

import { SCREEN_REFRESH_MS } from '@/config';

export function useSessionMimicry(sessionId: string): {
	judging: boolean;
	sounds: { sound: SessionSound; wordName: string }[];
	multiDay: boolean;
	loading: boolean;
	loadFailed: boolean;
	refreshing: boolean;
	refresh(): void;
} {
	const focused = useIsFocused();

	const {
		data: sessionData,
		isPending: isSessionPending,
		isError: isSessionError,
		isRefetching: isSessionRefetching,
		refetch: refetchSession,
	} = useQuery({
		...getSessionOptions({ id: sessionId }),
		refetchInterval: (query) =>
			focused && query.state.data?.judgment_status === 'pending' ? SCREEN_REFRESH_MS : false,
	});
	const {
		data: sessionSoundListData,
		isPending: isSessionSoundListPending,
		isError: isSessionSoundListError,
		isRefetching: isSessionSoundListRefetching,
		refetch: refetchSessionSoundList,
	} = useQuery({
		...getSessionSoundListOptions({ id: sessionId }),
		enabled: sessionData?.judgment_status === 'done',
	});
	const {
		data: wordListData,
		isPending: isWordListPending,
		isError: isWordListError,
		refetch: refetchWordList,
	} = useQuery(getWordListOptions());

	const judged = sessionData?.judgment_status === 'done';
	const period = sessionData?.period;
	const multiDay = period?.ended_at
		? new Date(period.started_at).toDateString() !== new Date(period.ended_at).toDateString()
		: false;
	const mimicry = (sessionSoundListData ?? [])
		.filter((sound) => sound.judgment?.word_id)
		.map((sound) => ({
			sound,
			wordName: wordListData?.find((word) => word.id === sound.judgment?.word_id)?.name ?? '',
		}));

	return {
		judging: sessionData?.judgment_status === 'pending',
		sounds: mimicry,
		multiDay,
		loading: isSessionPending || (judged && (isSessionSoundListPending || isWordListPending)),
		loadFailed: isSessionError || isSessionSoundListError || isWordListError,
		refreshing: isSessionRefetching || isSessionSoundListRefetching,
		refresh: () => {
			void refetchSession();
			void refetchSessionSoundList();
			void refetchWordList();
		},
	};
}
