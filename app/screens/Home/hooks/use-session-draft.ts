import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { selectableWords } from "@/components/session/word-picker"
import { settingsQueryOptions } from "@/hooks/apis/settings"
import { wordsQueryOptions } from "@/hooks/apis/words"
import type { SleepSettings } from "@/types/apis/settings"
import type { Word } from "@/types/apis/words"
import type { LearningDuration, SessionDraft } from "@/types/navigation"

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
	setSleep(sleep: SleepSettings): void
	resetDraft(): void
}

export function useSessionDraft(): SessionDraftState {
	const words = useQuery(wordsQueryOptions())
	const settings = useQuery(settingsQueryOptions())

	const [wordId, setWordId] = useState<string | null>(null)
	const [duration, setDuration] = useState(UNTIL_END)
	const [sleepOverride, setSleep] = useState<SleepSettings | null>(null)

	const available = selectableWords(words.data ?? [])
	const word = available.find((item) => item.id === wordId) ?? null
	const sleep = sleepOverride ?? settings.data?.sleep
	const sleepChanged =
		sleepOverride !== null &&
		(sleepOverride.sleep_at !== settings.data?.sleep.sleep_at ||
			sleepOverride.wake_at !== settings.data?.sleep.wake_at)

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
		setSleep,
		resetDraft: () => {
			setWordId(null)
			setDuration(UNTIL_END)
			setSleep(null)
		},
	}
}
