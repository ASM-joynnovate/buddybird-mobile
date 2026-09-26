import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import type { SoundFeedback } from "@/components/session/sound-row"
import { soundFeedbackMutationOptions, soundFeedbackQueryOptions } from "@/hooks/apis/mocks"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"

type Feedback = "up" | "down"

export function useSoundFeedback(): SoundFeedback {
	const saved = useQuery(soundFeedbackQueryOptions())

	const saving = useIdempotentMutation(soundFeedbackMutationOptions())

	const [chosen, setChosen] = useState<Record<string, Feedback>>({})
	const [failedId, setFailedId] = useState<string | null>(null)

	function rollback(soundId: string, previous: Feedback | undefined) {
		setChosen((current) =>
			previous
				? { ...current, [soundId]: previous }
				: Object.fromEntries(Object.entries(current).filter(([id]) => id !== soundId)),
		)
		setFailedId(soundId)
	}

	function choose(soundId: string, value: Feedback) {
		const previous = chosen[soundId]

		setChosen((current) => ({ ...current, [soundId]: value }))
		setFailedId((current) => (current === soundId ? null : current))

		saving.mutateAsync({ soundId, feedback: value }).catch(() => rollback(soundId, previous))
	}

	return {
		feedbackOf: (soundId) =>
			chosen[soundId] ??
			saved.data?.find((item) => item.sound_id === soundId)?.feedback ??
			null,
		failedId,
		choose,
	}
}
