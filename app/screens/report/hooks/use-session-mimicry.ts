import { useQuery } from '@tanstack/react-query';

import type { SessionSound } from '@/types/apis/sessions';

import { sessionQueryOptions, sessionSoundsQueryOptions } from '@/hooks/apis/sessions';
import { wordsQueryOptions } from '@/hooks/apis/words';

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

	const session = useQuery({
		...sessionQueryOptions(sessionId),
		refetchInterval: (query) =>
			focused && query.state.data?.judgment_status === 'pending' ? SCREEN_REFRESH_MS : false,
	});
	const sounds = useQuery({
		...sessionSoundsQueryOptions(sessionId),
		enabled: session.data?.judgment_status === 'done',
	});
	const words = useQuery(wordsQueryOptions());

	const judged = session.data?.judgment_status === 'done';
	const period = session.data?.period;
	const multiDay = period?.ended_at
		? new Date(period.started_at).toDateString() !== new Date(period.ended_at).toDateString()
		: false;
	const mimicry = (sounds.data ?? [])
		.filter((sound) => sound.judgment?.word_id)
		.map((sound) => ({
			sound,
			wordName: words.data?.find((word) => word.id === sound.judgment?.word_id)?.name ?? '',
		}));

	return {
		judging: session.data?.judgment_status === 'pending',
		sounds: mimicry,
		multiDay,
		loading: session.isPending || (judged && (sounds.isPending || words.isPending)),
		loadFailed: session.isError || sounds.isError || words.isError,
		refreshing: session.isRefetching || sounds.isRefetching,
		refresh: () => {
			void session.refetch();
			void sounds.refetch();
			void words.refetch();
		},
	};
}
