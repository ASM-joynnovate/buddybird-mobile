import type { Session, SessionSound } from '@/types/apis/sessions';

import { useGetSessionSoundList } from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';

export function useSessionMimicry(session: Session): {
	mimicrySounds: { sound: SessionSound; wordName: string }[];
	multiDay: boolean;
	refreshing: boolean;
	refresh(): void;
} {
	const {
		data: sessionSoundListData,
		isRefetching: isSessionSoundListRefetching,
		refetch: refetchSessionSoundList,
	} = useGetSessionSoundList({ id: session.id });
	const { data: wordListData, refetch: refetchWordList } = useGetWordList();

	const period = session.period;
	const multiDay = period.ended_at
		? new Date(period.started_at).toDateString() !== new Date(period.ended_at).toDateString()
		: false;
	const mimicrySounds = sessionSoundListData
		.filter((sound) => sound.judgment?.word_id)
		.map((sound) => ({
			sound,
			wordName: wordListData.find((word) => word.id === sound.judgment?.word_id)?.name ?? '',
		}));

	return {
		mimicrySounds,
		multiDay,
		refreshing: isSessionSoundListRefetching,
		refresh: () => {
			void refetchSessionSoundList();
			void refetchWordList();
		},
	};
}
