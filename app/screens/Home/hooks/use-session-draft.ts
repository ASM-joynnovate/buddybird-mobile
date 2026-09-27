import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { selectableWords } from "@/components/session/word-picker"
import { settingsQueryOptions } from "@/hooks/apis/settings"
import { wordsQueryOptions } from "@/hooks/apis/words"
import type { SleepSettings } from "@/types/apis/settings"
import type { Word } from "@/types/apis/words"
import type { SessionDraft } from "@/types/navigation"

export type SessionDraftState = {
	words: Word[]
	word: Word | null
	durationMs: number | null
	sleep: SleepSettings | undefined
	draft: SessionDraft | null
	loading: boolean
	isError: boolean
	retry(): void
	selectWord(id: string): void
	setDurationMs(durationMs: number | null): void
	setSleep(sleep: SleepSettings): void
	resetDraft(): void
}

export function useSessionDraft(): SessionDraftState {
	const words = useQuery(wordsQueryOptions())
	const settings = useQuery(settingsQueryOptions())

	const [wordId, setWordId] = useState<string | null>(null)
	const [durationMs, setDurationMs] = useState<number | null>(null)
	const [sleepOverride, setSleep] = useState<SleepSettings | null>(null)

	const available = selectableWords(words.data ?? [])
	const word = available.find((item) => item.id === wordId) ?? null
	const sleep = sleepOverride ?? settings.data?.sleep

	return {
		words: available,
		word,
		durationMs,
		sleep,
		draft: word && sleep ? { wordId: word.id, durationMs, sleep } : null,
		loading: words.isPending || settings.isPending,
		isError: words.isError || settings.isError,
		retry: () => {
			void words.refetch()
			void settings.refetch()
		},
		selectWord: setWordId,
		setDurationMs,
		setSleep,
		resetDraft: () => {
			setWordId(null)
			setDurationMs(null)
			setSleep(null)
		},
	}
}
