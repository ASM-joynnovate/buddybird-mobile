import { useEffect, useState } from "react"

import { readNoticeMutationOptions } from "@/hooks/apis/notices"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { launch } from "@/screens/home/hooks/launch"
import type { Notice } from "@/types/apis/notices"

export function useNoticePopup(notices: readonly Notice[] | undefined): {
	current: Notice | null
	close(): void
} {
	const { mutate } = useIdempotentMutation(readNoticeMutationOptions())

	const [queue, setQueue] = useState<readonly Notice[]>([])

	useEffect(() => {
		if (!notices || launch.noticesShown) {
			return
		}

		launch.noticesShown = true

		setQueue(notices)
	}, [notices])

	const current = queue[0] ?? null

	return {
		current,
		close: () => {
			if (current) {
				mutate({ id: current.id })

				setQueue((items) => items.slice(1))
			}
		},
	}
}
