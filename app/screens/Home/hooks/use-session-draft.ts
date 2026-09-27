import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { selectableWords } from "@/components/session/word-picker"
import { settingsQueryOptions } from "@/hooks/apis/settings"
import { wordsQueryOptions } from "@/hooks/apis/words"
import type { Word } from "@/types/apis/words"
import type { LearningDuration, SessionDraft } from "@/types/navigation"
import type { SleepSettings } from "@/types/sleep-settings"

const UNTIL_END: LearningDuration = { ms: null, custom: false }

type SessionDraftState = {
	words: Word[]
	word: Word | null
	duration: LearningDuration
	sleep: SleepSettings | undefined
	draft: SessionDraft | null
	loading: boolean
	isError: boolean
	retry(): void
	selectWord(id: string): void
	setDuration(duration: LearningDuration): void
	setEditedSleep(sleep: SleepSettings): void
	resetDraft(): void
}

export function useSessionDraft(): SessionDraftState {
	const words = useQuery(wordsQueryOptions())
	const settings = useQuery(settingsQueryOptions())

	const [wordId, setWordId] = useState<string | null>(null)
	const [duration, setDuration] = useState(UNTIL_END)
	const [editedSleep, setEditedSleep] = useState<SleepSettings | null>(null)

	const available = selectableWords(words.data ?? [])
	const word = available.find((item) => item.id === wordId) ?? null
	const sleep = editedSleep ?? settings.data?.sleep
	const sleepChanged =
		editedSleep !== null &&
		(editedSleep.sleep_at !== settings.data?.sleep.sleep_at ||
			editedSleep.wake_at !== settings.data?.sleep.wake_at)

	return {
		words: available,
		word,
		duration,
		sleep,
		draft: word && sleep ? { wordId: word.id, duration, sleep, sleepChanged } : null,
		loading: words.isPending || settings.isPending,
		isError: words.isError || settings.isError,
		retry: () => {
			void words.refetch()
			void settings.refetch()
		},
		selectWord: setWordId,
		setDuration,
		setEditedSleep,
		resetDraft: () => {
			setWordId(null)
			setDuration(UNTIL_END)
			setEditedSleep(null)
		},
	}
}
