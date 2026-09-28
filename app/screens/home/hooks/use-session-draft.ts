import { useState } from 'react';

import type { Word } from '@/types/apis/words';

import type { LearningDuration, SessionDraft } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import { useGetSettings } from '@/hooks/apis/settings';
import { useGetWordList } from '@/hooks/apis/words';

const UNTIL_END: LearningDuration = { ms: null, custom: false };

type SessionDraftState = {
	words: Word[];
	word: Word | null;
	duration: LearningDuration;
	sleep: SleepSettings;
	draft: SessionDraft | null;
	selectWord(id: string): void;
	setDuration(duration: LearningDuration): void;
	setEditedSleep(sleep: SleepSettings): void;
	resetDraft(): void;
};

export function useSessionDraft(): SessionDraftState {
	const [wordId, setWordId] = useState<string | null>(null);
	const [duration, setDuration] = useState(UNTIL_END);
	const [editedSleep, setEditedSleep] = useState<SleepSettings | null>(null);

	const { data: wordListData } = useGetWordList();
	const { data: settingsData } = useGetSettings();

	const available = wordListData.filter((item) => item.recordings.length > 0);
	const word = available.find((item) => item.id === wordId) ?? null;
	const sleep = editedSleep ?? settingsData.sleep;
	const sleepChanged =
		editedSleep !== null &&
		(editedSleep.sleep_at !== settingsData.sleep.sleep_at || editedSleep.wake_at !== settingsData.sleep.wake_at);

	return {
		words: available,
		word,
		duration,
		sleep,
		draft: word ? { wordId: word.id, duration, sleep, sleepChanged } : null,
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
