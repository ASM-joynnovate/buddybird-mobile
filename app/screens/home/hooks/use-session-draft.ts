import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import type { Word } from '@/types/apis/words';

import type { LearningDuration, SessionDraft } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import { getSettingsOptions } from '@/hooks/apis/settings';
import { getWordListOptions } from '@/hooks/apis/words';

const UNTIL_END: LearningDuration = { ms: null, custom: false };

type SessionDraftState = {
	words: Word[];
	word: Word | null;
	duration: LearningDuration;
	sleep: SleepSettings | undefined;
	draft: SessionDraft | null;
	loading: boolean;
	isError: boolean;
	retry(): void;
	selectWord(id: string): void;
	setDuration(duration: LearningDuration): void;
	setEditedSleep(sleep: SleepSettings): void;
	resetDraft(): void;
};

export function useSessionDraft(): SessionDraftState {
	const [wordId, setWordId] = useState<string | null>(null);
	const [duration, setDuration] = useState(UNTIL_END);
	const [editedSleep, setEditedSleep] = useState<SleepSettings | null>(null);

	const {
		data: wordListData,
		isPending: isWordListPending,
		isError: isWordListError,
		refetch: refetchWordList,
	} = useQuery(getWordListOptions());
	const {
		data: settingsData,
		isPending: isSettingsPending,
		isError: isSettingsError,
		refetch: refetchSettings,
	} = useQuery(getSettingsOptions());

	const available = (wordListData ?? []).filter((item) => item.recordings.length > 0);
	const word = available.find((item) => item.id === wordId) ?? null;
	const sleep = editedSleep ?? settingsData?.sleep;
	const sleepChanged =
		editedSleep !== null &&
		(editedSleep.sleep_at !== settingsData?.sleep.sleep_at || editedSleep.wake_at !== settingsData?.sleep.wake_at);

	return {
		words: available,
		word,
		duration,
		sleep,
		draft: word && sleep ? { wordId: word.id, duration, sleep, sleepChanged } : null,
		loading: isWordListPending || isSettingsPending,
		isError: isWordListError || isSettingsError,
		retry: () => {
			void refetchWordList();
			void refetchSettings();
		},
		selectWord: setWordId,
		setDuration,
		setEditedSleep,
		resetDraft: () => {
			setWordId(null);
			setDuration(UNTIL_END);
			setEditedSleep(null);
		},
	};
}
