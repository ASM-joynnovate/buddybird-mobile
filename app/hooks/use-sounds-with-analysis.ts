import { useQuery } from "@tanstack/react-query"

import { soundAnalysisQueryOptions } from "@/hooks/apis/mocks"
import { wordsQueryOptions } from "@/hooks/apis/words"
import type { TimelineSound } from "@/mocks/types"
import type { SessionSound } from "@/types/apis/sessions"

export function useSoundsWithAnalysis(
	sounds: readonly SessionSound[] | undefined,
	refetchInterval: number | false = false,
): {
	soundsWithAnalysis: TimelineSound[] | undefined
	isError: boolean
	retry(): void
} {
	const analyses = useQuery({ ...soundAnalysisQueryOptions(), refetchInterval })
	const words = useQuery(wordsQueryOptions())

	const soundsWithAnalysis =
		sounds && analyses.data && words.data
			? sounds
					.map((sound) => ({
						...sound,
						wordName:
							words.data.find((word) => word.id === sound.judgment?.word_id)?.name ??
							null,
						analysis: analyses.data.find((item) => item.sound_id === sound.id) ?? null,
					}))
					.filter((sound) => sound.analysis?.is_parrot_sound !== false)
			: undefined

	return {
		soundsWithAnalysis,
		isError: analyses.isError || words.isError,
		retry: () => {
			void analyses.refetch()
			void words.refetch()
		},
	}
}
